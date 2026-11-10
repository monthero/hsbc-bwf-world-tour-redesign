import { useMemo } from 'react';

import { tournamentKey, type TournamentLookup } from '~/utils/news';

import { NO_YEARS, useTournamentsByCode } from './useTournaments';

export const useTournamentLookup = (enabled = true): TournamentLookup | undefined => {
  const byCode = useTournamentsByCode(enabled ? undefined : NO_YEARS);
  return useMemo(() => {
    if (!byCode) return undefined;
    const all = [...byCode.values()];
    return {
      byCode,
      byName: new Map(all.map((t) => [tournamentKey(t.year, t.name), t])),
      byYear: Map.groupBy(all, (t) => t.year),
    };
  }, [byCode]);
};
