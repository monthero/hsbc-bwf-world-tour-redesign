import { useSyncExternalStore } from 'react';

import { dayjs, type Dayjs } from '~/utils/dates';

const TICK_MS = 60_000;

const listeners = new Set<() => void>();
let now: Dayjs = dayjs();
let timer: ReturnType<typeof setInterval> | undefined;

const tick = () => {
  now = dayjs();
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (!timer) {
    now = dayjs();
    timer = setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size || !timer) return;
    clearInterval(timer);
    timer = undefined;
  };
};

const snapshot = () => now;

export const useNow = () => useSyncExternalStore(subscribe, snapshot, snapshot);
