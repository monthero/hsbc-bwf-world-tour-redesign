import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { playerQuery } from '~/api/queries';
import type { PlayerProfileDto, SeasonIndex, SeasonMatch, Tournament } from '~/types';
import { date } from '~/utils/dates';
import { toMatch } from '~/utils/matches';
import { seasonIndexOf } from '~/utils/season';

import { useSeasonMatches, useTournamentsByCode } from './useTournaments';

const combineFiles = (results: UseQueryResult<PlayerProfileDto>[]) =>
  results.every((r) => !r.isPending) ? results.flatMap((r) => (r.data ? [r.data] : [])) : undefined;

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
      const match = toMatch(m, m.day, date(m.day).diff(tournament.start, 'day'), i);
      const key = `${tournament.code}:${match.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ match, tournament });
    });
  return out;
};

export const useCareerIndex = (ids: readonly string[]): SeasonIndex | undefined => {
  const byCode = useTournamentsByCode();
  const season = useSeasonMatches();
  const files = useQueries({ queries: ids.map((id) => playerQuery(id)), combine: combineFiles });
  return useMemo(() => {
    if (!byCode || !season.ready || !files) return undefined;
    const skip = new Set(season.matches.map((s) => s.tournament.code));
    return seasonIndexOf([...careerMatches(files, byCode, skip), ...season.matches]);
  }, [byCode, season, files]);
};
