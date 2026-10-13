import type { MediaItem } from '~/api/schemas';
import type { Match } from '~/types';

import { plural } from './format';
import { roundName } from './matches';
import type { MatchMedia } from './media-link';
import { foldText } from './names';

export { linkMedia, type LinkedMedia, type MatchMedia } from './media-link';

const YT_WATCH = 'https://www.youtube.com/watch?v=';
const YT_THUMB = 'https://i.ytimg.com/vi/';

export const watchUrl = (id: string) => `${YT_WATCH}${id}`;

export const thumbUrl = (id: string) => `${YT_THUMB}${id}/mqdefault.jpg`;

const pad = (n: number) => String(n).padStart(2, '0');

export const durationLabel = (sec: number | null) => {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export const isStreaming = (item: MediaItem) => item.live !== 'none';

const courtKey = (day: number, court: number) => `${day}:${court}`;

export const courtStreams = (items: readonly MediaItem[]) => {
  const out = new Map<string, MediaItem>();
  for (const item of items) {
    if (item.kind !== 'court_stream' || !isStreaming(item) || !item.day || !item.court) continue;
    const key = courtKey(item.day, item.court);
    if (!out.has(key)) out.set(key, item);
  }
  return out;
};

export const matchStream = (
  byMatch: ReadonlyMap<string, MatchMedia>,
  byCourt: ReadonlyMap<string, MediaItem>,
  m: Pick<Match, 'id' | 'dayIndex' | 'court'>,
) => byMatch.get(m.id)?.stream ?? byCourt.get(courtKey(m.dayIndex + 1, m.court));

export const hasCourtStreams = (items: readonly MediaItem[], day: number) =>
  items.some((i) => i.kind === 'court_stream' && i.day === day);

export const offAir = (items: readonly MediaItem[]) =>
  items.filter((i) => i.live !== 'upcoming').map((i) => (i.live === 'live' ? { ...i, live: 'none' as const } : i));

export const isAvailableIn = (item: MediaItem, country: string | null) => {
  const { region } = item;
  if (!country || !region) return true;
  if (region.allowed) return region.allowed.includes(country);
  return !region.blocked?.includes(country);
};

const visibleCache = new WeakMap<readonly MediaItem[], Map<string, readonly MediaItem[]>>();

export const visibleIn = <T extends MediaItem>(items: readonly T[], hideFor: string | null): readonly T[] => {
  if (!hideFor) return items;
  const byCountry = visibleCache.get(items) ?? new Map<string, readonly MediaItem[]>();
  visibleCache.set(items, byCountry);
  const hit = byCountry.get(hideFor) as readonly T[] | undefined;
  if (hit) return hit;
  const kept = items.filter((i) => isAvailableIn(i, hideFor));
  const out = kept.length === items.length ? items : kept;
  byCountry.set(hideFor, out);
  return out;
};

export const regionHiddenNote = (n: number) =>
  `${plural(n, 'video')} not available in your region ${n === 1 ? 'is' : 'are'} hidden. You can show them in Settings.`;

const YEAR = /\b(?:19|20)\d{2}\b/;
const DAY_SEGMENT = /^day \d+$/i;
const COURT_SEGMENT = /^court \d+$/i;
const VERSUS = / vs /i;
const SIDE_TAGS = / ?(?:\([A-Z]{3}\)|\[\d+\])/g;

const words = (s: string) =>
  foldText(s)
    .split(/[^a-z]+/)
    .filter(Boolean);

const isEventSegment = (segment: string, name: readonly string[]) => {
  if (!name.length || !YEAR.test(segment)) return false;
  const have = words(segment);
  return name.every((w) => have.includes(w));
};

export const compactTitle = (title: string, eventName: string) => {
  const name = words(eventName);
  const parts = title.split('|').map((p) => p.trim());
  const rest = parts.filter((p) => !isEventSegment(p, name));
  if (rest.length === parts.length) return title;
  const players = rest.find((p) => VERSUS.test(p));
  const day = rest.find((p) => DAY_SEGMENT.test(p));
  const court = rest.find((p) => COURT_SEGMENT.test(p));
  const round = rest.filter((p) => p !== players && p !== day && p !== court);
  if ((!players && !court) || round.length > 1) return title;
  const head = players?.replace(SIDE_TAGS, '');
  return [head, round[0] && roundName(round[0]), day, court].filter(Boolean).join(' | ');
};
