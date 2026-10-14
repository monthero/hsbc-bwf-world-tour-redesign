import type { ClockMode, TimeZoneMode } from '~/stores/settings';
import type { Match } from '~/types';

import { dayjs, ISO_DAY, type Dayjs } from './dates';

export interface ClockPrefs {
  timeZone: TimeZoneMode;
  clock: ClockMode;
}

export interface VenueTime {
  timeZone: string | null;
  utcOffset: number | null;
}

export interface ClockTime {
  at: Dayjs;
  text: string;
  hour: string;
  zone: string;
  shift: number;
  alt: string;
}

export const NO_VENUE: VenueTime = { timeZone: null, utcOffset: null };

const TIME_FORMATS: Record<ClockMode, string> = { '24h': 'HH:mm', '12h': 'h:mm A' };
const HOUR_FORMATS: Record<ClockMode, string> = { '24h': 'HH:00', '12h': 'h A' };
const WEEKDAY = 'ddd';
const STAMP_DAY = 'ddd D MMM';
const ANY_DAY = '2000-01-01';
const NOON = 12;
const HOUR_MIN = 60;
const OFFSET_LIKE = /^(GMT|UTC)/;
const ZONE_LOCALES = [undefined, 'en-GB'];
const VENUE_ALT = 'at the venue';
const MINE_ALT = 'your time';

const zoneOffsets = new Map<string, number>();
const zoneFormats = new Map<string, Intl.DateTimeFormat[]>();
const zoneLabels = new Map<string, string>();

const zoneOffsetOn = (timeZone: string, day: string) => {
  const key = `${timeZone}|${day}`;
  const cached = zoneOffsets.get(key);
  if (cached !== undefined) return cached;
  const offset = dayjs.utc(day).add(NOON, 'hour').tz(timeZone).utcOffset();
  zoneOffsets.set(key, offset);
  return offset;
};

export const venueTimeOn = (timeZone: string | null, day: string, fallback: number | null): VenueTime => ({
  timeZone,
  utcOffset: timeZone && day ? zoneOffsetOn(timeZone, day) : fallback,
});

const offsetLabel = (offset: number) => {
  if (!offset) return 'GMT';
  const abs = Math.abs(offset);
  const min = abs % HOUR_MIN;
  return `GMT${offset < 0 ? '-' : '+'}${Math.floor(abs / HOUR_MIN)}${min ? `:${String(min).padStart(2, '0')}` : ''}`;
};

const formatsFor = (timeZone: string | undefined) => {
  const key = timeZone ?? '';
  const cached = zoneFormats.get(key);
  if (cached) return cached;
  const formats = ZONE_LOCALES.map((locale) => new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' }));
  zoneFormats.set(key, formats);
  return formats;
};

const zoneLabel = (at: Dayjs, offset: number, timeZone: string | undefined) => {
  const key = `${timeZone ?? ''}|${offset}`;
  const cached = zoneLabels.get(key);
  if (cached !== undefined) return cached;
  const names = formatsFor(timeZone).map(
    (f) => f.formatToParts(at.toDate()).find((p) => p.type === 'timeZoneName')?.value ?? '',
  );
  const label = names.find((n) => n && !OFFSET_LIKE.test(n)) ?? offsetLabel(offset);
  zoneLabels.set(key, label);
  return label;
};

const venueLabel = (at: Dayjs, offset: number, timeZone: string | null) =>
  timeZone ? zoneLabel(at, offset, timeZone) : offsetLabel(offset);

const dayShift = (d: Dayjs, base: string) => (base ? dayjs.utc(d.format(ISO_DAY)).diff(dayjs.utc(base), 'day') : 0);

const plain = (at: Dayjs, clock: ClockMode): ClockTime => ({
  at,
  text: at.format(TIME_FORMATS[clock]),
  hour: at.format(HOUR_FORMATS[clock]),
  zone: '',
  shift: 0,
  alt: '',
});

const zoned = (
  instant: Dayjs,
  timeZone: string | null,
  offset: number,
  base: string,
  { timeZone: mode, clock }: ClockPrefs,
): ClockTime => {
  const venue = instant.utcOffset(offset);
  const local = instant.local();
  const mine = mode === 'mine';
  const shown = mine ? local : venue;
  if (local.utcOffset() === offset) return plain(shown, clock);
  const other = mine ? venue : local;
  const otherDay = other.format(ISO_DAY) === shown.format(ISO_DAY) ? '' : `${other.format(WEEKDAY)} `;
  return {
    ...plain(shown, clock),
    zone: mine ? zoneLabel(local, local.utcOffset(), undefined) : venueLabel(venue, offset, timeZone),
    shift: dayShift(shown, base),
    alt: `${otherDay}${other.format(TIME_FORMATS[clock])} ${mine ? VENUE_ALT : MINE_ALT}`,
  };
};

export const matchClock = (
  m: Pick<Match, 'date' | 'time' | 'timeZone' | 'utcOffset'>,
  prefs: ClockPrefs,
): ClockTime | null => {
  if (!m.time) return null;
  const wall = dayjs.utc(`${m.date || ANY_DAY}T${m.time}`);
  if (m.utcOffset === null || !m.date) return plain(wall, prefs.clock);
  return zoned(wall.subtract(m.utcOffset, 'minute'), m.timeZone, m.utcOffset, m.date, prefs);
};

export const instantClock = (iso: string, venue: VenueTime, prefs: ClockPrefs): ClockTime => {
  const instant = dayjs.utc(iso);
  if (venue.utcOffset === null) return plain(instant.local(), prefs.clock);
  return zoned(instant, venue.timeZone, venue.utcOffset, '', prefs);
};

export const venueTimeAt = (timeZone: string | null, iso: string) =>
  venueTimeOn(timeZone, dayjs.utc(iso).format(ISO_DAY), null);

export type NextKind = 'first' | 'later';

const SOON_MIN = 60;

export const nextLabel = (start: ClockTime, kind: NextKind, now: Dayjs) => {
  const today = now.utcOffset(start.at.utcOffset()).format(ISO_DAY);
  const days = dayjs.utc(start.at.format(ISO_DAY)).diff(dayjs.utc(today), 'day');
  if (days === 1) return 'Tomorrow';
  if (days > 1) return start.at.format(WEEKDAY);
  if (kind === 'later' || days < 0) return 'Next';
  return start.at.diff(now, 'minute') <= SOON_MIN ? 'Soon' : 'In a few hours';
};

export const dayMark = (shift: number) => (shift > 0 ? `+${shift}` : `−${-shift}`);

export const formatStamp = (c: ClockTime) => `${c.at.format(STAMP_DAY)}, ${c.text}${c.zone ? ` ${c.zone}` : ''}`;
