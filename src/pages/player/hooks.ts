import { useMemo } from 'react';

import { usePlayerDirectory, useRankingHistory } from '~/hooks/usePlayers';
import type { SeasonIndex } from '~/types';

import { buildHistory } from './utils';

export const usePlayerHistory = (rankingId: string | undefined, index: SeasonIndex | undefined) => {
  const query = useRankingHistory(rankingId);
  const { data: dir } = usePlayerDirectory();
  const view = useMemo(() => (query.data ? buildHistory(query.data, index, dir) : undefined), [query.data, index, dir]);
  return { view, loading: !!rankingId && query.isPending && !query.isError };
};
