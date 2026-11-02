import { use, useCallback } from 'react';

import { TournamentRankContext, type RankOf } from '~/contexts';
import { worldRank } from '~/utils/rankings';

import { usePlayerDirectory } from './usePlayers';

export const useTeamRank = (): RankOf => {
  const rankOf = use(TournamentRankContext);
  const { data: dir } = usePlayerDirectory();
  return useCallback<RankOf>(
    (players, ev) => (rankOf ? rankOf(players, ev) : worldRank(dir, players, ev)),
    [rankOf, dir],
  );
};
