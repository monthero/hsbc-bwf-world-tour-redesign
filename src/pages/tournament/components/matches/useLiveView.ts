import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { liveGameStatsQuery, liveMatchStatsQuery, liveServersQuery } from '~/api/queries';
import type { Match, Tournament } from '~/types';

import { toLiveView } from './liveView';

const CHALLENGE_SHOW_MS = 60_000;

export const useLiveView = (tournament: Tournament, m: Match) => {
  const tmtId = tournament.tmtId ?? 0;
  const live = m.status === 'P' && !!tmtId;
  const enabled = live && !!m.code;
  const code = m.code ?? '';
  const q = useQuery({ ...liveMatchStatsQuery(tmtId, code), enabled });
  const g = useQuery({ ...liveGameStatsQuery(tmtId, code, m.games.length + 1), enabled });
  const { data: servers } = useQuery({ ...liveServersQuery(tmtId), enabled: live });
  const stats = q.data ?? null;
  const game = g.data ?? null;
  const recent = stats?.challenge;
  const challenge = recent && q.dataUpdatedAt - recent.at < CHALLENGE_SHOW_MS ? recent : null;
  const server = m.code ? servers?.[m.code] : undefined;
  return useMemo(() => toLiveView(m, stats, game, challenge, server), [m, stats, game, challenge, server]);
};
