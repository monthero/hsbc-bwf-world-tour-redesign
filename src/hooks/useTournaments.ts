import { useQueries, useQuery, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  calendarQuery,
  seasonsQuery,
  seriesQuery,
  tournamentDrawQuery,
  tournamentEntriesQuery,
  tournamentMatchesGlance,
  tournamentMatchesQuery,
  type TournamentRef,
} from '~/api/queries';
import type { Calendar, SeasonMatch, Tournament, TournamentMatches } from '~/types';
import { dayjs, todayIso } from '~/utils/dates';
import type { ClockPrefs } from '~/utils/match-time';
import { buildSchedule, toDrawSlots, toEntryListings } from '~/utils/matches';
import {
  inStatusWindow,
  isHeld,
  isStartingSoon,
  knownFinalsCity,
  liveAndNext,
  pickLive,
  resolveTournament,
  toTournament,
  withStart,
} from '~/utils/tournaments';

import { useClockPrefs } from './useMatchClock';

const NO_TOURNAMENT: TournamentRef = { code: '', start: '', end: '', archived: false };

const selectTournaments = (c: Calendar) => c.events.map((e, i) => toTournament(e, i));

const selectFinalsCity = (c: Calendar) => knownFinalsCity(c.events.find((e) => e.level === 'Finals'));

const selectHeld = (c: Calendar) => selectTournaments(c).filter(isHeld);

type Glance = TournamentMatches | null | undefined;

const glanceOf = (r: UseQueryResult<TournamentMatches> | undefined): Glance =>
  r?.data ?? (r?.isError ? null : undefined);

const resolveList = (list: Tournament[], glances: ReadonlyMap<string, Glance>) =>
  list.map((t) => (glances.has(t.code) ? resolveTournament(t, glances.get(t.code)) : t));

const useGlances = (list: readonly Tournament[] | undefined) => {
  const near = useMemo(() => list?.filter(inStatusWindow) ?? [], [list]);
  const combine = useCallback(
    (results: UseQueryResult<TournamentMatches>[]) =>
      new Map(near.map((t, i): [string, Glance] => [t.code, glanceOf(results[i])])),
    [near],
  );
  return useQueries({ queries: near.map((t) => tournamentMatchesGlance(t)), combine });
};

const withStarts = (list: Tournament[], prefs: ClockPrefs) => {
  const now = dayjs();
  return list.map((t) => (t.firstMatch ? withStart(t, prefs, isStartingSoon(t, now)) : t));
};

const useResolved = (list: Tournament[] | undefined) => {
  const glances = useGlances(list);
  const prefs = useClockPrefs();
  return useMemo(
    () => (list && glances.size ? withStarts(resolveList(list, glances), prefs) : list),
    [list, glances, prefs],
  );
};

const LANDING_WAIT_MS = 1500;

const within = <T>(work: Promise<T>, ms: number) =>
  Promise.race([work, new Promise<undefined>((done) => setTimeout(done, ms))]);

export const findLiveTournament = async (client: QueryClient) => {
  const calendar = await client.ensureQueryData(calendarQuery()).catch(() => undefined);
  if (!calendar) return undefined;
  const held = selectHeld(calendar);
  const near = held.filter(inStatusWindow);
  const work = Promise.all(near.map((t) => client.fetchQuery(tournamentMatchesGlance(t)).catch(() => null)));
  const found = await within(work, LANDING_WAIT_MS);
  const glances = new Map(near.map((t, i): [string, Glance] => [t.code, found?.[i]]));
  return pickLive(resolveList(held, glances));
};

export const useTournaments = (year?: number) => {
  const q = useQuery({ ...calendarQuery(year), select: selectTournaments });
  const data = useResolved(q.data);
  return { ...q, data };
};

export const useLiveAndNext = () => {
  const { data } = useTournaments();
  return useMemo(() => liveAndNext(data?.filter(isHeld) ?? []), [data]);
};

export const useSeasonEdge = (year: number, enabled: boolean) => {
  const { data: seasons } = useSeasons();
  const listed = !!seasons?.seasons.some((s) => s.year === year);
  return useQuery({ ...calendarQuery(year), select: selectHeld, enabled: enabled && listed }).data;
};

export const useTournament = (year: string | number, slug: string) => {
  const y = Number(year);
  const q = useTournaments(y);
  const tournament = q.data?.find((t) => t.slug === slug);
  const held = useMemo(() => q.data?.filter((t) => isHeld(t) || t === tournament) ?? [], [q.data, tournament]);
  const index = tournament ? held.indexOf(tournament) : -1;
  const before = useSeasonEdge(y - 1, index === 0);
  const after = useSeasonEdge(y + 1, index >= 0 && index === held.length - 1);
  return {
    ...q,
    tournament,
    prev: index < 0 ? undefined : (held[index - 1] ?? before?.at(-1)),
    next: index < 0 ? undefined : (held[index + 1] ?? after?.[0]),
  };
};

export const useSchedule = (t: Tournament | undefined) =>
  useQuery({
    ...tournamentMatchesQuery(t ?? NO_TOURNAMENT),
    enabled: !!t && isHeld(t),
    select: useCallback((d: TournamentMatches) => (t ? buildSchedule(t, d, todayIso()) : undefined), [t]),
  });

export const useDraw = (t: Tournament) => useQuery({ ...tournamentDrawQuery(t), select: toDrawSlots });

export const useEntries = (t: Tournament) => useQuery({ ...tournamentEntriesQuery(t), select: toEntryListings });

export const useSeasonMatches = (enabled = true) => {
  const { data: held } = useQuery({ ...calendarQuery(), select: selectHeld });
  const tournaments = useResolved(held);
  const list = enabled ? (tournaments ?? []) : [];
  const combine = useCallback(
    (results: UseQueryResult<TournamentMatches>[]) => {
      const ready = !!tournaments && results.length > 0 && results.every((r) => r.isSuccess);
      if (!ready) return { ready: false, matches: [] as SeasonMatch[] };
      const matches = tournaments.flatMap((t, i) => {
        const d = results[i]?.data;
        return d ? buildSchedule(t, d, todayIso()).matches.map((match) => ({ match, tournament: t })) : [];
      });
      return { ready: true, matches };
    },
    [tournaments],
  );
  return useQueries({ queries: list.map((t) => tournamentMatchesQuery(t)), combine });
};

export const useSeasons = () => useQuery(seasonsQuery());

export const useSeries = (id: string | undefined) => useQuery({ ...seriesQuery(id ?? ''), enabled: !!id });

const useSeasonCalendars = <T>(enabled: boolean, combine: (results: UseQueryResult<Tournament[]>[]) => T) => {
  const { data } = useSeasons();
  const seasons = enabled ? (data?.seasons ?? []) : [];
  return useQueries({
    queries: seasons.map((s) => ({ ...calendarQuery(s.year), select: selectTournaments })),
    combine,
  });
};

const combineByCode = (results: UseQueryResult<Tournament[]>[]) => {
  if (!results.length || !results.every((r) => r.isSuccess)) return undefined;
  return new Map(results.flatMap((r) => r.data ?? []).map((t) => [t.code, t]));
};

export const useTournamentsByCode = () => useSeasonCalendars(true, combineByCode);

const combineAll = (results: UseQueryResult<Tournament[]>[]) => results.flatMap((r) => r.data ?? []);

export const useAllTournaments = (enabled: boolean) => useSeasonCalendars(enabled, combineAll);

export const useFinalsCity = () => useQuery({ ...calendarQuery(), select: selectFinalsCity }).data ?? null;
