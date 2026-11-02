import { clamp } from '@mantine/hooks';
import { getRouteApi } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import type { EventCode } from '~/types';
import { toggleItem } from '~/utils/filter';

import { useUpdateSearch } from '../../hooks';
import type { MatchSort, TournamentSearch } from '../../types';
import { parseCourts, parseEvents } from './utils';

const route = getRouteApi('/world-tour/$year/$slug');

const selectDay = (s: TournamentSearch) => s.day;
const selectEvents = (s: TournamentSearch) => s.events?.join(',') ?? '';
const selectCourts = (s: TournamentSearch) => s.courts?.join(',') ?? '';
const selectQ = (s: TournamentSearch) => s.q ?? '';
const selectFollowing = (s: TournamentSearch) => !!s.following;
const selectFlame = (s: TournamentSearch) => !!s.flame;
const selectSort = (s: TournamentSearch): MatchSort => s.sort ?? 'time';

export interface MatchFilters {
  day: number;
  events: EventCode[];
  courts: number[];
  q: string;
  following: boolean;
  flame: boolean;
  sort: MatchSort;
  count: number;
  hasFilters: boolean;
  setDay: (day: number) => void;
  toggleEvent: (ev: EventCode) => void;
  toggleCourt: (court: number) => void;
  clear: () => void;
  setQ: (q: string) => void;
  toggleFollowing: () => void;
  toggleFlame: () => void;
  setSort: (sort: MatchSort) => void;
}

export const useMatchFilters = (dayCount: number, focusIndex: number): MatchFilters => {
  const rawDay = route.useSearch({ select: selectDay });
  const eventsKey = route.useSearch({ select: selectEvents });
  const courtsKey = route.useSearch({ select: selectCourts });
  const urlQ = route.useSearch({ select: selectQ });
  const following = route.useSearch({ select: selectFollowing });
  const flame = route.useSearch({ select: selectFlame });
  const sort = route.useSearch({ select: selectSort });
  const [q, setDraft] = useState(urlQ);

  const day = clamp(rawDay ?? focusIndex, 0, Math.max(0, dayCount - 1));
  const events = useMemo(() => parseEvents(eventsKey), [eventsKey]);
  const courts = useMemo(() => parseCourts(courtsKey), [courtsKey]);

  const update = useUpdateSearch();

  const setDay = useCallback((d: number) => update({ day: d }), [update]);
  const toggleEvent = useCallback((ev: EventCode) => update((s) => ({ events: toggleItem(s.events, ev) })), [update]);
  const toggleCourt = useCallback((c: number) => update((s) => ({ courts: toggleItem(s.courts, c) })), [update]);
  const clear = useCallback(() => update({ events: undefined, courts: undefined }), [update]);
  const setQ = useCallback(
    (v: string) => {
      setDraft(v);
      update({ q: v || undefined });
    },
    [update],
  );
  const toggleFollowing = useCallback(() => update((s) => ({ following: s.following ? undefined : true })), [update]);
  const toggleFlame = useCallback(() => update((s) => ({ flame: s.flame ? undefined : true })), [update]);
  const setSort = useCallback((v: MatchSort) => update({ sort: v === 'time' ? undefined : v }), [update]);

  const count = events.length + courts.length + (q ? 1 : 0) + (following ? 1 : 0) + (flame ? 1 : 0);

  return useMemo(
    () => ({
      day,
      events,
      courts,
      q,
      following,
      flame,
      sort,
      count,
      hasFilters: events.length > 0 || courts.length > 0,
      setDay,
      toggleEvent,
      toggleCourt,
      clear,
      setQ,
      toggleFollowing,
      toggleFlame,
      setSort,
    }),
    [
      day,
      events,
      courts,
      q,
      following,
      flame,
      sort,
      count,
      setDay,
      toggleEvent,
      toggleCourt,
      clear,
      setQ,
      toggleFollowing,
      toggleFlame,
      setSort,
    ],
  );
};
