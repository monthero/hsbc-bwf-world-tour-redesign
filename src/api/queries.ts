import { queryOptions, type Query, type QueryClient, type QueryKey } from '@tanstack/react-query';
import type { z } from 'zod';

import { LIVE_DATA, SEASON_YEAR } from '~/constants';
import { dayjs, ISO_DAY, isoRange, today, todayIso } from '~/utils/dates';
import { trackLiveStats, type LiveStats } from '~/utils/live';
import { finalDayOver } from '~/utils/matches';

import { isRejected, LIVE_COOLDOWN_MS, livePollMs, liveRetry } from './bwf/http';
import type { NameOf } from './bwf/normalize';
import { fetchDayMatches, fetchDraw, fetchEntries, fetchLiveServers, fetchMatchStats } from './bwf/tournaments';
import { fetchJson, getJson, retryUnless, STATIC } from './client';
import {
  Calendar,
  type CalendarEventDto,
  PlayerMedia,
  PlayerMediaIndex,
  PlayerProfileDto,
  PlayersData,
  RaceRankings,
  RankingHistory,
  type RankingKind,
  RankingTable,
  Seasons,
  Series,
  TournamentMatches,
  TournamentMedia,
  ViewerGeo,
} from './schemas';

const staticQuery = <K extends QueryKey, S extends z.ZodType>(queryKey: K, path: string, schema: S) =>
  queryOptions({ queryKey, queryFn: ({ signal }) => fetchJson(path, schema, signal), ...STATIC });

export const playersQuery = () => staticQuery(['players'], 'players.json', PlayersData);

const directoryNames = async (client: QueryClient): Promise<NameOf> => {
  const { players } = await client.ensureQueryData(playersQuery());
  return (id) => players[id]?.name;
};

export const seasonsQuery = () => staticQuery(['seasons'], 'seasons.json', Seasons);

export const calendarQuery = (year = SEASON_YEAR) => staticQuery(['calendar', year], `calendar-${year}.json`, Calendar);

export type TournamentRef = Pick<CalendarEventDto, 'code' | 'start' | 'end' | 'archived'>;

const FRESH_MS = 15_000;
const UPCOMING_MS = 5 * 60_000;
const POLL_ON_COURT_MS = 20_000;
const POLL_IDLE_MS = 60_000;

const dayOffset = (n: number) => today().add(n, 'day').format(ISO_DAY);

const isSettledDay = (day: string) => day < dayOffset(-1);

const isSnapshotEvent = (t: TournamentRef) => !LIVE_DATA || t.archived;

const isLiveEvent = (t: TournamentRef) => t.start <= todayIso() && !isSettledDay(t.end);

const hasMatchOnCourt = (d: TournamentMatches | undefined) =>
  Object.values(d?.days ?? {}).some((ms) => ms.some((m) => m.status === 'P'));

const livePoll = (t: TournamentRef) => (q: Query<TournamentMatches>) => {
  if (q.state.data?.stale) return LIVE_COOLDOWN_MS;
  if (hasMatchOnCourt(q.state.data)) return POLL_ON_COURT_MS;
  return finalDayOver(t.end, q.state.data) ? false : POLL_IDLE_MS;
};

const matchesPolicy = (t: TournamentRef) => {
  if (isSnapshotEvent(t) || isSettledDay(t.end)) return STATIC;
  if (isLiveEvent(t)) return { staleTime: FRESH_MS, refetchInterval: livePoll(t) };
  return { staleTime: UPCOMING_MS };
};

const dayMatchesQuery = (code: string, day: string) =>
  queryOptions({
    queryKey: ['bwf', 'day-matches', code, day],
    queryFn: async ({ client, signal }) => fetchDayMatches(code, day, await directoryNames(client), signal),
    retry: liveRetry,
    ...(isSettledDay(day) ? STATIC : { staleTime: FRESH_MS }),
  });

const STATS_POLL_MS = 10_000;

export const liveMatchStatsQuery = (tmtId: number, matchCode: string) =>
  queryOptions({
    queryKey: ['bwf', 'match-stats', tmtId, matchCode],
    queryFn: async ({ client, queryKey, signal }) => {
      const sides = await fetchMatchStats(tmtId, matchCode, signal);
      return sides && trackLiveStats(client.getQueryData<LiveStats | null>(queryKey), sides, Date.now());
    },
    staleTime: 5_000,
    gcTime: 60_000,
    retry: liveRetry,
    refetchInterval: () => livePollMs(STATS_POLL_MS),
  });

export const liveServersQuery = (tmtId: number) =>
  queryOptions({
    queryKey: ['bwf', 'live-servers', tmtId],
    queryFn: ({ signal }) => fetchLiveServers(tmtId, signal),
    staleTime: 5_000,
    gcTime: 60_000,
    retry: liveRetry,
    refetchInterval: (q) => (isRejected(q.state.error) ? false : livePollMs(STATS_POLL_MS)),
  });

const fetchLiveMatches = async (t: TournamentRef, client: QueryClient): Promise<TournamentMatches> => {
  const last = t.end < dayOffset(1) ? t.end : dayOffset(1);
  const days = t.start <= last ? isoRange(t.start, last) : [];
  const results = await Promise.all(days.map((day) => client.fetchQuery(dayMatchesQuery(t.code, day))));
  return {
    code: t.code,
    asOf: dayjs().format('HH:mm'),
    days: Object.fromEntries(days.map((day, i) => [day, results[i]?.matches ?? []])),
    plannedDays: {},
    utcOffsets: Object.fromEntries(
      days.flatMap((day, i) => {
        const offset = results[i]?.utcOffset ?? null;
        return offset === null ? [] : [[day, offset]];
      }),
    ),
  };
};

const fetchSnapshot = (code: string, signal: AbortSignal) =>
  fetchJson(`tournaments/${code}.json`, TournamentMatches, signal);

const fetchFallback = (code: string, signal: AbortSignal): Promise<TournamentMatches> =>
  fetchSnapshot(code, signal).then(
    (d) => ({ ...d, stale: true }),
    () => ({ code, asOf: '', days: {}, plannedDays: {}, stale: true }),
  );

export const tournamentMatchesQuery = (t: TournamentRef) =>
  queryOptions({
    queryKey: ['tournament', t.code, 'matches'],
    queryFn: ({ client, signal }) =>
      isSnapshotEvent(t)
        ? fetchSnapshot(t.code, signal)
        : fetchLiveMatches(t, client).catch(() => fetchFallback(t.code, signal)),
    ...matchesPolicy(t),
  });

export type LiveTournamentRef = TournamentRef & Pick<CalendarEventDto, 'tmtId' | 'cancelled'>;

const extrasPolicy = (t: LiveTournamentRef) => {
  if (isSnapshotEvent(t) || t.cancelled || !t.tmtId) return { enabled: false };
  return { retry: liveRetry, ...(isSettledDay(t.end) ? STATIC : { staleTime: UPCOMING_MS }) };
};

export const tournamentDrawQuery = (t: LiveTournamentRef) =>
  queryOptions({
    queryKey: ['bwf', 'draw', t.code],
    queryFn: async ({ client, signal }) => fetchDraw(t.tmtId ?? 0, await directoryNames(client), signal),
    ...extrasPolicy(t),
  });

export const tournamentEntriesQuery = (t: LiveTournamentRef) =>
  queryOptions({
    queryKey: ['bwf', 'entries', t.code],
    queryFn: async ({ client, signal }) => fetchEntries(t.tmtId ?? 0, await directoryNames(client), signal),
    ...extrasPolicy(t),
  });

const MEDIA_REFRESH_MS = 60 * 60_000;
const MEDIA_SETTLE_DAYS = 3;

const mediaPolicy = (t: TournamentRef) => {
  if (t.start > todayIso()) return { enabled: false };
  if (t.end < dayOffset(-MEDIA_SETTLE_DAYS)) return STATIC;
  return { staleTime: MEDIA_REFRESH_MS, refetchInterval: MEDIA_REFRESH_MS };
};

const mediaUrl = (code: string) => `/yt-api/media/${code}`;

export const tournamentMediaQuery = (t: TournamentRef) =>
  queryOptions({
    queryKey: ['media', t.code],
    queryFn: ({ signal }) => getJson(mediaUrl(t.code), TournamentMedia, signal),
    retry: retryUnless(404, 503),
    ...mediaPolicy(t),
  });

export const refreshTournamentMedia = (client: QueryClient, t: TournamentRef, reason: string) =>
  client.fetchQuery({
    ...tournamentMediaQuery(t),
    queryFn: ({ signal }) =>
      getJson(`${mediaUrl(t.code)}?fresh=${encodeURIComponent(reason)}`, TournamentMedia, signal),
    staleTime: 0,
  });

export const viewerGeoQuery = () =>
  queryOptions({
    queryKey: ['geo'],
    queryFn: ({ signal }) => getJson('/yt-api/geo', ViewerGeo, signal),
    ...STATIC,
    retry: false,
  });

export const rankingHistoryQuery = (playerId: string) => ({
  ...staticQuery(['rankings', playerId], `rankings/${playerId}.json`, RankingHistory),
  retry: false,
});

export const raceRankingsQuery = () => staticQuery(['race-rankings'], 'race-rankings.json', RaceRankings);

export const rankingTableQuery = (kind: RankingKind) =>
  staticQuery(['ranking-table', kind], `ranking-tables/${kind}.json`, RankingTable);

export const seriesQuery = (id: string) => staticQuery(['series', id], `series/${id}.json`, Series);

export const playerQuery = (id: string) => ({
  ...staticQuery(['player', id], `players/${id}.json`, PlayerProfileDto),
  retry: false,
});

export const playerMediaIndexQuery = () => staticQuery(['player-media'], 'player-media/index.json', PlayerMediaIndex);

export const playerMediaQuery = (id: string) =>
  staticQuery(['player-media', id], `player-media/${id}.json`, PlayerMedia);
