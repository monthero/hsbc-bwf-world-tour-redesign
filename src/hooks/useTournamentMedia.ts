import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { refreshTournamentMedia, tournamentMediaQuery, viewerGeoQuery } from '~/api/queries';
import type { MediaItem } from '~/api/schemas';
import { useShowBlocked } from '~/stores/settings';
import type { Match, MatchStatus, Tournament, TournamentDay } from '~/types';
import { weakCached } from '~/utils/cache';
import {
  courtReplays,
  courtStreams,
  hasCourtStreams,
  isAvailableIn,
  isStreaming,
  linkMedia,
  matchReplays,
  matchStream,
  offAir,
  visibleIn,
  type LinkedMedia,
} from '~/utils/media';
import { hasStarted } from '~/utils/tournaments';

import { useSchedule } from './useTournaments';

const NO_ITEMS: MediaItem[] = [];
const NO_MATCHES: Match[] = [];
const START_DELAY_MS = 30_000;
const END_DELAY_MS = 90_000;

interface TournamentLinks extends LinkedMedia<Match> {
  courts: ReadonlyMap<string, MediaItem>;
  courtVods: ReadonlyMap<string, MediaItem>;
  replays: ReadonlyMap<string, MediaItem>;
}

const linksByItems = weakCached((items: readonly MediaItem[]) =>
  weakCached((matches: readonly Match[]): TournamentLinks => {
    const linked = linkMedia(items, matches);
    const courtVods = courtReplays(items, matches);
    return {
      ...linked,
      courts: courtStreams(items),
      courtVods,
      replays: matchReplays(linked.byMatch, courtVods, matches),
    };
  }),
);

const linksOf = (items: readonly MediaItem[], matches: readonly Match[]) => linksByItems(items)(matches);

const playRemaining = (day: TournamentDay | undefined) => !!day?.matches.some((m) => m.status !== 'F');

const useMediaFeed = (t: Tournament) => {
  const media = useQuery(tournamentMediaQuery(t));
  const { data: schedule } = useSchedule(t);
  const raw = media.data?.items ?? NO_ITEMS;
  const matches = schedule?.matches ?? NO_MATCHES;
  const today = schedule?.days[schedule.todayIndex];
  const onAir = t.status === 'live' && playRemaining(today);
  const items = useMemo(() => (onAir ? raw : offAir(raw)), [raw, onAir]);
  return { items, matches, today, onAir, isLoading: media.isLoading, isError: media.isError };
};

const useViewerCountry = () => useQuery(viewerGeoQuery()).data?.country ?? null;

export const useMediaAvailable = (item: MediaItem) => isAvailableIn(item, useViewerCountry());

export const useVisibleMedia = <T extends MediaItem>(items: readonly T[]) => {
  const showBlocked = useShowBlocked();
  const country = useViewerCountry();
  const hideFor = showBlocked ? null : country;
  return useMemo(() => visibleIn(items, hideFor), [items, hideFor]);
};

export const useTournamentMedia = (t: Tournament) => {
  const { items: all, matches, ...feed } = useMediaFeed(t);
  const items = useVisibleMedia(all);
  const linked = useMemo(() => linksOf(items, matches), [items, matches]);
  return { ...linked, ...feed, items, hidden: all.length - items.length, enabled: hasStarted(t) };
};

export const useMatchReplays = (t: Tournament) => useTournamentMedia(t).replays;

export const useMatchStream = (t: Tournament, match: Match) => {
  const { byMatch, courts } = useTournamentMedia(t);
  return matchStream(byMatch, courts, match);
};

export const useLiveStreamSync = (t: Tournament) => {
  const client = useQueryClient();
  const { items, matches, today, onAir } = useMediaFeed(t);
  const { byMatch, courts } = useMemo(() => linksOf(items, matches), [items, matches]);
  const asked = useRef(new Set<string>());
  const statuses = useRef(new Map<string, MatchStatus>());
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (!onAir || !today) return;
    const day = today.index + 1;
    const courtMode = hasCourtStreams(items, day);
    const ask = (reason: string, delay: number) => {
      if (asked.current.has(reason)) return;
      asked.current.add(reason);
      const id = window.setTimeout(() => {
        timers.current.delete(id);
        refreshTournamentMedia(client, t, reason).catch(() => undefined);
      }, delay);
      timers.current.add(id);
    };
    if (!items.some(isStreaming)) ask(`d${day}`, 0);
    for (const m of today.matches) {
      const was = statuses.current.get(m.id);
      statuses.current.set(m.id, m.status);
      if (m.status === 'P' && !matchStream(byMatch, courts, m))
        ask(courtMode ? `c${day}-${m.court}` : `m${m.id}`, START_DELAY_MS);
      if (!courtMode && was === 'P' && m.status === 'F') ask(`e${m.id}`, END_DELAY_MS);
    }
  }, [client, t, onAir, today, items, byMatch, courts]);
};
