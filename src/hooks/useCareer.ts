import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { playerQuery } from '~/api/queries';
import { SEASON_YEAR } from '~/constants';
import type { PlayerProfileDto, SeasonIndex, SeasonMatch, Tournament } from '~/types';
import { date } from '~/utils/dates';
import { venueTimeOn } from '~/utils/match-time';
import { toMatch } from '~/utils/matches';
import { seasonIndexOf } from '~/utils/season';

import { NO_YEARS, useLiveSeasonMatches, useTournamentsByCode } from './useTournaments';

const combineFiles = (results: UseQueryResult<PlayerProfileDto>[]) =>
  results.every((r) => !r.isPending) ? results.flatMap((r) => (r.data ? [r.data] : [])) : undefined;

export const careerYears = (files: readonly PlayerProfileDto[] | undefined) => {
  if (!files) return NO_YEARS;
  if (files.some((f) => !f.seasons)) return undefined;
  return [...new Set([SEASON_YEAR, ...files.flatMap((f) => f.seasons ?? [])])].sort((a, b) => b - a);
};

const careerMatches = (
  files: readonly PlayerProfileDto[],
  byCode: ReadonlyMap<string, Tournament>,
  skip: ReadonlySet<string>,
): SeasonMatch[] => {
  const seen = new Set<string>();
  const out: SeasonMatch[] = [];
  for (const f of files)
    f.matches.forEach((m, i) => {
      const tournament = byCode.get(m.tournament);
      if (!tournament || skip.has(m.tournament)) return;
      const venue = venueTimeOn(tournament.timeZone, m.day, null);
      const match = toMatch(m, m.day, date(m.day).diff(tournament.start, 'day'), i, venue);
      const key = `${tournament.code}:${match.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ match, tournament });
    });
  return out;
};

export const useCareerIndex = (ids: readonly string[]): SeasonIndex | undefined => {
  const files = useQueries({ queries: ids.map((id) => playerQuery(id)), combine: combineFiles });
  const years = useMemo(() => careerYears(files), [files]);
  const byCode = useTournamentsByCode(years);
  const live = useLiveSeasonMatches();
  return useMemo(() => {
    if (!byCode || !live.ready || !live.tournaments || !files) return undefined;
    const lookup = new Map([...byCode, ...live.tournaments.map((t) => [t.code, t] as const)]);
    const skip = new Set(live.matches.map((s) => s.tournament.code));
    return seasonIndexOf([...careerMatches(files, lookup, skip), ...live.matches]);
  }, [byCode, live.ready, live.tournaments, live.matches, files]);
};
