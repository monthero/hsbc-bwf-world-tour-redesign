import { msg } from '@lingui/core/macro';

import type { MediaItem } from '~/api/schemas';
import { translate } from '~/i18n/lazy';
import type { Match } from '~/types';

import { weakCached } from './cache';
import { dayjs } from './dates';
import { foldWords } from './fold';
import { venueTimeOn } from './match-time';
import { roundName } from './matches';
import type { MatchMedia } from './media-link';

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

const matchKey = (m: Pick<Match, 'dayIndex' | 'court'>) => courtKey(m.dayIndex + 1, m.court);

const isCourtStream = (item: MediaItem) => item.kind === 'court_stream' && !!item.day && !!item.court;

export const courtStreams = (items: readonly MediaItem[]) => {
  const out = new Map<string, MediaItem>();
  for (const item of items) {
    if (!isCourtStream(item) || !isStreaming(item)) continue;
    const key = courtKey(item.day ?? 0, item.court ?? 0);
    if (!out.has(key)) out.set(key, item);
  }
  return out;
};

export const matchStream = (
  byMatch: ReadonlyMap<string, MatchMedia>,
  byCourt: ReadonlyMap<string, MediaItem>,
  m: Pick<Match, 'id' | 'dayIndex' | 'court'>,
) => byMatch.get(m.id)?.stream ?? byCourt.get(matchKey(m));

const SESSION_LEAD_MS = 30 * 60_000;

type TimedMatch = Pick<Match, 'id' | 'dayIndex' | 'court' | 'status' | 'date' | 'time' | 'timeZone' | 'utcOffset'>;

const matchInstant = (m: TimedMatch) => {
  if (!m.date || !m.time) return null;
  const { utcOffset } = venueTimeOn(m.timeZone, m.date, m.utcOffset);
  return utcOffset === null ? null : dayjs.utc(`${m.date}T${m.time}`).subtract(utcOffset, 'minute').valueOf();
};

const covers = (item: MediaItem, at: number) =>
  !item.startedAt ||
  (Date.parse(item.startedAt) - SESSION_LEAD_MS <= at && (!item.endedAt || at <= Date.parse(item.endedAt)));

const sessionOf = (list: readonly MediaItem[], m: TimedMatch) => {
  const at = matchInstant(m);
  const fits = at === null ? list : list.filter((i) => covers(i, at));
  return fits.length === 1 ? fits[0] : undefined;
};

export const courtReplays = (items: readonly MediaItem[], matches: readonly TimedMatch[]) => {
  const streams = Map.groupBy(
    items.filter((i) => isCourtStream(i) && i.live !== 'upcoming'),
    (i) => courtKey(i.day ?? 0, i.court ?? 0),
  );
  const busy = new Set(matches.filter((m) => m.status !== 'F').map(matchKey));
  const out = new Map<string, MediaItem>();
  for (const m of matches) {
    const key = matchKey(m);
    const list = m.status === 'F' ? streams.get(key) : undefined;
    const vod = list && sessionOf(list, m);
    if (vod && (vod.live === 'none' || !busy.has(key))) out.set(m.id, vod);
  }
  return out;
};

const namedStream = (media: MatchMedia | undefined) => (media?.stream?.live === 'live' ? media.stream : undefined);

export const replayStream = (media: MatchMedia | undefined, court: MediaItem | undefined) =>
  namedStream(media) ?? court;

export const matchReplays = (
  byMatch: ReadonlyMap<string, MatchMedia>,
  matches: readonly Pick<Match, 'id' | 'status'>[],
) => {
  const out = new Map<string, MediaItem>();
  for (const m of matches) {
    if (m.status !== 'F') continue;
    const media = byMatch.get(m.id);
    const item = media?.full ?? namedStream(media) ?? media?.highlights;
    if (item) out.set(m.id, item);
  }
  return out;
};

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

const visibleCache = weakCached((_items: readonly MediaItem[]) => new Map<string, readonly MediaItem[]>());

export const visibleIn = <T extends MediaItem>(items: readonly T[], hideFor: string | null): readonly T[] => {
  if (!hideFor) return items;
  const byCountry = visibleCache(items);
  const hit = byCountry.get(hideFor) as readonly T[] | undefined;
  if (hit) return hit;
  const kept = items.filter((i) => isAvailableIn(i, hideFor));
  const out = kept.length === items.length ? items : kept;
  byCountry.set(hideFor, out);
  return out;
};

const REGION_HIDDEN = msg({
  message:
    '{count, plural, one {# video not available in your region is hidden. You can show it in Settings.} other {# videos not available in your region are hidden. You can show them in Settings.}}',
  comment: 'Note under a video list: some YouTube videos are blocked in the visitor’s country and were left out',
});

export const regionHiddenNote = (n: number) => translate(REGION_HIDDEN, { count: n });

const YEAR = /\b(?:19|20)\d{2}\b/;
const DAY_SEGMENT = /^day \d+$/i;
const COURT_SEGMENT = /^court \d+$/i;
const VERSUS = / vs /i;
const SIDE_TAGS = / ?(?:\([A-Z]{3}\)|\[\d+\])/g;

const isEventSegment = (segment: string, name: readonly string[]) => {
  if (!name.length || !YEAR.test(segment)) return false;
  const have = foldWords(segment);
  return name.every((w) => have.includes(w));
};

export const compactTitle = (title: string, eventName: string) => {
  const name = foldWords(eventName);
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
