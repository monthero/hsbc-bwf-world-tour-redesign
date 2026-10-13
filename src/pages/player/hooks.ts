import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { playerMediaIndexQuery, playerMediaQuery } from '~/api/queries';
import type { PlayerMediaIndex } from '~/api/schemas';
import { usePlayerDirectory, useRankingHistory } from '~/hooks/usePlayers';
import type { SeasonIndex } from '~/types';

import { buildHistory } from './utils';

export const usePlayerHistory = (rankingId: string | undefined, index: SeasonIndex | undefined) => {
  const query = useRankingHistory(rankingId);
  const { data: dir } = usePlayerDirectory();
  const view = useMemo(() => (query.data ? buildHistory(query.data, index, dir) : undefined), [query.data, index, dir]);
  return { view, loading: !!rankingId && query.isPending && !query.isError };
};

export const usePlayerMediaCount = (id: string) => {
  const select = useCallback((d: PlayerMediaIndex) => (d.counts[id] ?? []).reduce((a, b) => a + b, 0), [id]);
  return useQuery({ ...playerMediaIndexQuery(), select });
};

export const usePlayerMedia = (id: string, enabled: boolean) => useQuery({ ...playerMediaQuery(id), enabled });
