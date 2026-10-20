import { useMatchLiveView } from '~/components/match';
import type { Match, Tournament } from '~/types';

import { useMatchOpen } from '../../hooks';

export const useLiveView = <T extends Element>(tournament: Tournament, m: Match) =>
  useMatchLiveView<T>(tournament, m, useMatchOpen());
