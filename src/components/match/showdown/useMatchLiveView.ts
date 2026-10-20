import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { liveGameStatsQuery, liveMatchStatsQuery, liveReceiverQuery, liveServersQuery } from '~/api/queries';
import { useInView } from '~/hooks/useInView';
import type { Match, Tournament } from '~/types';

import { toLiveView } from './liveView';

const CHALLENGE_SHOW_MS = 60_000;

export const useMatchLiveView = <T extends Element>(
  tournament: Tournament,
  m: Match,
  covered = false,
  withReceiver = false,
) => {
  const [ref, inView] = useInView<T>();
  const tmtId = tournament.tmtId ?? 0;
  const live = m.status === 'P' && !!tmtId && inView && !covered;
  const enabled = live && !!m.code;
  const code = m.code ?? '';
  const q = useQuery({ ...liveMatchStatsQuery(tmtId, code), enabled });
  const g = useQuery({ ...liveGameStatsQuery(tmtId, code, m.games.length + 1), enabled });
  const { data: servers } = useQuery({ ...liveServersQuery(tmtId), enabled: live });
  const { data: receiver = null } = useQuery({ ...liveReceiverQuery(tmtId, code), enabled: enabled && withReceiver });
  const stats = q.data ?? null;
  const game = g.data ?? null;
  const recent = stats?.challenge;
  const challenge = recent && q.dataUpdatedAt - recent.at < CHALLENGE_SHOW_MS ? recent : null;
  const server = m.code ? servers?.[m.code] : undefined;
  const view = useMemo(
    () => toLiveView(m, stats, game, challenge, server, receiver),
    [m, stats, game, challenge, server, receiver],
  );
  return [ref, view] as const;
};
