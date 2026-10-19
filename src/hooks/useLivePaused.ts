import { useSyncExternalStore } from 'react';

import { livePaused, subscribeLivePaused } from '~/api/bwf/http';

export const useLivePaused = () => useSyncExternalStore(subscribeLivePaused, livePaused, livePaused);
