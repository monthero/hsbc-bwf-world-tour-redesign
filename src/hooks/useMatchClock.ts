import { useCallback, useMemo } from 'react';

import { useSettings } from '~/stores/settings';
import type { Match } from '~/types';
import { instantClock, matchClock, venueTimeAt, type ClockPrefs } from '~/utils/match-time';

export const useClockPrefs = (): ClockPrefs => {
  const timeZone = useSettings((s) => s.timeZone);
  const clock = useSettings((s) => s.clock);
  return useMemo(() => ({ timeZone, clock }), [timeZone, clock]);
};

export const useMatchClock = () => {
  const prefs = useClockPrefs();
  return useCallback((m: Match) => matchClock(m, prefs), [prefs]);
};

export const useMatchTime = (m: Match) => {
  const prefs = useClockPrefs();
  return useMemo(() => matchClock(m, prefs), [m, prefs]);
};

export const useInstantTime = (iso: string | null, venueZone: string | null) => {
  const prefs = useClockPrefs();
  return useMemo(() => (iso ? instantClock(iso, venueTimeAt(venueZone, iso), prefs) : null), [iso, venueZone, prefs]);
};
