import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  calendarQuery,
  seasonsQuery,
  seriesQuery,
  tournamentDrawQuery,
  tournamentEntriesQuery,
  tournamentMatchesQuery,
  type TournamentRef,
} from '~/api/queries';
import type { Calendar, SeasonMatch, Tournament, TournamentMatches } from '~/types';
import { todayIso } from '~/utils/dates';
import { buildSchedule, finalDayOver, toDrawSlots, toEntryListings } from '~/utils/matches';
import { isHeld, isLive, knownFinalsCity, liveAndNext, toTournament } from '~/utils/tournaments';

const NO_TOURNAMENT: TournamentRef = { code: '', start: '', end: '', archived: false };

const selectTournaments = (c: Calendar) => c.events.map((e, i) => toTournament(e, i));

const selectFinalsCity = (c: Calendar) => knownFinalsCity(c.events.find((e) => e.level === 'Finals'));

const selectHeld = (c: Calendar) => selectTournaments(c).filter(isHeld);

const NO_CODES: ReadonlySet<string> = new Set();

const useFinishedEarly = (list: readonly Tournament[] | undefined) => {
  const live = useMemo(() => list?.filter(isLive) ?? [], [list]);
  const combine = useCallback(
    (results: UseQueryResult<TournamentMatches>[]) => {
      const done = live.filter((t, i) => finalDayOver(t.end, results[i]?.data));
      return done.length ? new Set(done.map((t) => t.code)) : NO_CODES;
    },
    [live],
  );
  return useQueries({ queries: live.map((t) => tournamentMatchesQuery(t)), combine });
};

const useResolved = (list: Tournament[] | undefined) => {
  const done = useFinishedEarly(list);
  return useMemo(
    () => (list && done.size ? list.map((t) => (done.has(t.code) ? { ...t, status: 'done' as const } : t)) : list),
    [list, done],
  );
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
