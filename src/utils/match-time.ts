import { msg, t } from '@lingui/core/macro';

import { translate } from '~/i18n/lazy';
import type { ClockMode, TimeZoneMode } from '~/stores/settings';
import type { Match } from '~/types';

import { dayjs, formatWall, ISO_DAY, type Dayjs } from './dates';

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
  clock: ClockMode;
}

export const NO_VENUE: VenueTime = { timeZone: null, utcOffset: null };

const TIME_FORMATS: Record<ClockMode, Intl.DateTimeFormatOptions> = {
  '24h': { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  '12h': { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' },
};
const HOUR_FORMATS: Record<ClockMode, Intl.DateTimeFormatOptions> = {
  '24h': TIME_FORMATS['24h'],
  '12h': { hour: 'numeric', hourCycle: 'h12' },
};
const WEEKDAY = { weekday: 'short' } as const;
const STAMP_DAY = { weekday: 'short', day: 'numeric', month: 'short' } as const;
const ANY_DAY = '2000-01-01';
const NOON = 12;
const HOUR_MIN = 60;
const OFFSET_LIKE = /^(GMT|UTC)/;
const ZONE_LOCALES = [undefined, 'en-GB'];
const ALT_TIMES = {
  venue: msg({
    message: '{time} at the venue',
    comment:
      'Second clock under a match time shown in the visitor’s time zone: the same moment in the venue’s local time. {time} is e.g. "15:30" or "Wed 15:30"',
  }),
  mine: msg({
    message: '{time} your time',
    comment:
      'Second clock under a match time shown in venue time: the same moment in the visitor’s own time zone. {time} is e.g. "09:30" or "Thu 09:30"',
  }),
};

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
  text: formatWall(at, TIME_FORMATS[clock]),
  hour: formatWall(at.subtract(at.minute(), 'minute'), HOUR_FORMATS[clock]),
  zone: '',
  shift: 0,
  alt: '',
  clock,
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
  const sameDay = other.format(ISO_DAY) === shown.format(ISO_DAY);
  const time = formatWall(other, sameDay ? TIME_FORMATS[clock] : { ...WEEKDAY, ...TIME_FORMATS[clock] });
  return {
    ...plain(shown, clock),
    zone: mine ? zoneLabel(local, local.utcOffset(), undefined) : venueLabel(venue, offset, timeZone),
    shift: dayShift(shown, base),
    alt: translate(ALT_TIMES[mine ? 'venue' : 'mine'], { time }),
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
  if (days === 1)
    return t({ message: 'Tomorrow', comment: 'When a player’s next match is: it is scheduled for tomorrow' });
  if (days > 1) return formatWall(start.at, WEEKDAY);
  if (kind === 'later' || days < 0)
    return t({
      message: 'Next',
      context: 'next match',
      comment: 'Label for a player’s next scheduled match, when its exact day is not shown',
    });
  return start.at.diff(now, 'minute') <= SOON_MIN
    ? t({ message: 'Soon', comment: 'When a player’s next match is: it starts within the hour' })
    : t({ message: 'In a few hours', comment: 'When a player’s next match is: later today, more than an hour away' });
};

export const dayMark = (shift: number) => (shift > 0 ? `+${shift}` : `−${-shift}`);

export const formatStamp = (c: ClockTime) => {
  const stamp = formatWall(c.at, { ...STAMP_DAY, ...TIME_FORMATS[c.clock] });
  return c.zone ? `${stamp} ${c.zone}` : stamp;
};
