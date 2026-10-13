import { useSyncExternalStore } from 'react';

export const MOBILE_QUERY = '(max-width: 47.99em)';

const media = typeof window === 'undefined' ? null : window.matchMedia(MOBILE_QUERY);
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const subscribe = (listener: () => void) => {
  if (!listeners.size) media?.addEventListener('change', notify);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) media?.removeEventListener('change', notify);
  };
};

const snapshot = () => media?.matches ?? false;
const serverSnapshot = () => false;

export const useIsMobile = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot);
