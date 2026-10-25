import { useQuery } from '@tanstack/react-query';
import { useCallback, type FC, type ReactNode } from 'react';

import { tournamentRanksQuery, type TournamentRef } from '~/api/queries';
import { TournamentRankContext, type RankOf } from '~/contexts';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import { frozenRank, worldRank } from '~/utils/rankings';

export const TournamentRanks: FC<{ tournament: TournamentRef; children: ReactNode }> = ({ tournament, children }) => {
  const { data: dir } = usePlayerDirectory();
  const { data: frozen } = useQuery(tournamentRanksQuery(tournament));
  const rankOf = useCallback<RankOf>(
    (players, ev) => (frozen ? frozenRank(frozen.ranks, players, ev) : worldRank(dir, players, ev)),
    [frozen, dir],
  );
  return <TournamentRankContext value={rankOf}>{children}</TournamentRankContext>;
};
