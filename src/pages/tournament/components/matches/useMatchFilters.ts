import { clamp } from '@mantine/hooks';
import { getRouteApi } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import type { EventCode } from '~/types';

import type { TournamentSearch } from '../../types';
import { parseCourts, parseEvents, toggleIn } from './utils';

const route = getRouteApi('/world-tour/$year/$slug');

const selectDay = (s: TournamentSearch) => s.day;
const selectEvents = (s: TournamentSearch) => s.events?.join(',') ?? '';
const selectCourts = (s: TournamentSearch) => s.courts?.join(',') ?? '';
const selectQ = (s: TournamentSearch) => s.q ?? '';
const selectFollowing = (s: TournamentSearch) => !!s.following;

const orUndefined = <T>(list: T[]) => (list.length ? list : undefined);

export interface MatchFilters {
  day: number;
  events: EventCode[];
  courts: number[];
  q: string;
  following: boolean;
  count: number;
  hasFilters: boolean;
  setDay: (day: number) => void;
  toggleEvent: (ev: EventCode) => void;
  toggleCourt: (court: number) => void;
  clear: () => void;
  setQ: (q: string) => void;
  toggleFollowing: () => void;
}

export const useMatchFilters = (dayCount: number, focusIndex: number): MatchFilters => {
  const navigate = route.useNavigate();
  const rawDay = route.useSearch({ select: selectDay });
  const eventsKey = route.useSearch({ select: selectEvents });
  const courtsKey = route.useSearch({ select: selectCourts });
  const urlQ = route.useSearch({ select: selectQ });
  const following = route.useSearch({ select: selectFollowing });
  const [q, setDraft] = useState(urlQ);

  const day = clamp(rawDay ?? focusIndex, 0, Math.max(0, dayCount - 1));
  const events = useMemo(() => parseEvents(eventsKey), [eventsKey]);
  const courts = useMemo(() => parseCourts(courtsKey), [courtsKey]);

  const update = useCallback(
    (patch: (s: TournamentSearch) => Partial<TournamentSearch>) =>
      void navigate({ search: (s) => ({ ...s, ...patch(s) }), replace: true, resetScroll: false }),
    [navigate],
  );

  const setDay = useCallback((d: number) => update(() => ({ day: d })), [update]);
  const toggleEvent = useCallback(
    (ev: EventCode) => update((s) => ({ events: orUndefined(toggleIn(s.events ?? [], ev)) })),
    [update],
  );
  const toggleCourt = useCallback(
    (c: number) => update((s) => ({ courts: orUndefined(toggleIn(s.courts ?? [], c)) })),
    [update],
  );
  const clear = useCallback(() => update(() => ({ events: undefined, courts: undefined })), [update]);
  const setQ = useCallback(
    (v: string) => {
      setDraft(v);
      update(() => ({ q: v || undefined }));
    },
    [update],
  );
  const toggleFollowing = useCallback(() => update((s) => ({ following: s.following ? undefined : true })), [update]);

  const count = events.length + courts.length + (q ? 1 : 0) + (following ? 1 : 0);

  return useMemo(
    () => ({
      day,
      events,
      courts,
      q,
      following,
      count,
      hasFilters: events.length > 0 || courts.length > 0,
      setDay,
      toggleEvent,
      toggleCourt,
      clear,
      setQ,
      toggleFollowing,
    }),
    [day, events, courts, q, following, count, setDay, toggleEvent, toggleCourt, clear, setQ, toggleFollowing],
  );
};
