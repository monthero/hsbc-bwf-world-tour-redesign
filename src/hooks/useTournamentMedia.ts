import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { refreshTournamentMedia, tournamentMediaQuery, viewerGeoQuery } from '~/api/queries';
import type { MediaItem } from '~/api/schemas';
import type { Match, MatchStatus, Tournament, TournamentDay } from '~/types';
import {
  courtStreams,
  hasCourtStreams,
  isAvailableIn,
  isStreaming,
  linkMedia,
  matchStream,
  offAir,
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
}

const linkCache = new WeakMap<readonly MediaItem[], WeakMap<readonly Match[], TournamentLinks>>();

const linksOf = (items: readonly MediaItem[], matches: readonly Match[]) => {
  const byMatches = linkCache.get(items) ?? new WeakMap<readonly Match[], TournamentLinks>();
  linkCache.set(items, byMatches);
  const hit = byMatches.get(matches);
  if (hit) return hit;
  const links = { ...linkMedia(items, matches), courts: courtStreams(items) };
  byMatches.set(matches, links);
  return links;
};

const playRemaining = (day: TournamentDay | undefined) => !!day?.matches.some((m) => m.status !== 'F');

export const useTournamentMedia = (t: Tournament) => {
  const media = useQuery(tournamentMediaQuery(t));
  const { data: schedule } = useSchedule(t);
  const raw = media.data?.items ?? NO_ITEMS;
  const matches = schedule?.matches ?? NO_MATCHES;
  const today = schedule?.days[schedule.todayIndex];
  const onAir = t.status === 'live' && playRemaining(today);
  const items = useMemo(() => (onAir ? raw : offAir(raw)), [raw, onAir]);
  const linked = useMemo(() => linksOf(items, matches), [items, matches]);
  return {
    ...linked,
    items,
    today,
    onAir,
    isLoading: media.isLoading,
    isError: media.isError,
    enabled: hasStarted(t),
  };
};

export const useMatchStream = (t: Tournament, match: Match) => {
  const { byMatch, courts } = useTournamentMedia(t);
  return matchStream(byMatch, courts, match);
};

export const useLiveStreamSync = (t: Tournament) => {
  const client = useQueryClient();
  const { items, byMatch, courts, today, onAir } = useTournamentMedia(t);
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

export const useViewerCountry = () => useQuery(viewerGeoQuery()).data?.country ?? null;

export const useMediaAvailable = (item: MediaItem) => isAvailableIn(item, useViewerCountry());
