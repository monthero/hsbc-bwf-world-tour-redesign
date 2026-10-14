import { LEVEL_META } from '~/constants';
import type { CalendarEventDto, Tournament } from '~/types';

import { countryCode } from './countries';
import { date, formatDateRange, today, type Dayjs } from './dates';
import { formatNumber } from './format';
import { tournamentHeaderUrl, tournamentLogoUrl } from './images';
import { toPlayer } from './names';

export const formatPrize = (n: number) => `$${formatNumber(n)}`;

const SHORT_UNITS = [
  [1e6, 'M'],
  [1e3, 'K'],
] as const;

export const formatPrizeShort = (n: number) => {
  const unit = SHORT_UNITS.find(([v]) => n >= v);
  return unit ? `$${Number((n / unit[0]).toFixed(2))}${unit[1]}` : formatPrize(n);
};

const TBC = 'TBC';

const FINALS_FALLBACK = 'the Finals';

const baseTitle = (e: CalendarEventDto) => {
  const sub = e.subtitle ?? '';
  return sub && e.title.endsWith(sub) ? e.title.slice(0, -sub.length).trim() : e.title;
};

const statusOf = (start: Dayjs, end: Dayjs, now: Dayjs): Tournament['status'] => {
  if (end.isBefore(now)) return 'done';
  return start.isAfter(now) ? 'up' : 'live';
};

export const toTournament = (e: CalendarEventDto, index: number): Tournament => {
  const now = today();
  const start = date(e.start);
  const end = date(e.end);
  const status = e.cancelled ? 'cancelled' : statusOf(start, end, now);
  const lv = LEVEL_META[e.level];
  const year = e.year;
  return {
    ...e,
    index,
    year,
    month: start.month(),
    status,
    daysUntil: start.diff(now, 'day'),
    dayNumber: now.diff(start, 'day') + 1,
    totalDays: end.diff(start, 'day') + 1,
    dates: formatDateRange(start, end),
    datesLong: `${formatDateRange(start, end, { long: true })} ${end.year()}`,
    place: [e.city, e.country].filter(Boolean).join(', '),
    cc: countryCode(e.country),
    prizeLabel: e.prize ? formatPrize(e.prize) : TBC,
    levelLabel: lv.long,
    levelColor: lv.color,
    logo: tournamentLogoUrl(e.code, e.logoVersion),
    header: tournamentHeaderUrl(e.code, e.headerVersion, 'wide'),
    headerSquare: tournamentHeaderUrl(e.code, e.headerVersion, 'square'),
    shortTitle: `${e.name} ${year}`,
    heading: `${baseTitle(e)} ${year}`,
    champions: e.winners.map((w) => ({ event: w.event, players: w.players.map((p) => toPlayer(p.name, p.cc, p.id)) })),
  };
};

export const liveDayLabel = (t: Pick<Tournament, 'dayNumber' | 'totalDays'>, withTotal = true) =>
  `Live · Day ${t.dayNumber}${withTotal ? ` of ${t.totalDays}` : ''}`;

export const countdownLabel = (t: Pick<Tournament, 'daysUntil'>, form: 'long' | 'in' | 'short' = 'long') => {
  const n = t.daysUntil;
  if (form === 'short') return n === 1 ? 'Tmrw' : `${n}d`;
  if (form === 'in') return n === 1 ? 'Tomorrow' : `In ${n} days`;
  return n === 1 ? 'Starts tomorrow' : `Starts in ${n} days`;
};

const FIXED_LABELS: Partial<Record<Tournament['status'], string>> = { done: 'Completed', cancelled: 'Cancelled' };

export const statusLabel = (t: Tournament) => {
  if (t.status === 'live') return liveDayLabel(t);
  return FIXED_LABELS[t.status] ?? countdownLabel(t);
};

export const mapsUrl = (t: Tournament) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.venue ? `${t.venue}, ` : 'Badminton arena, '}${t.city}, ${t.country}`)}`;

export const tournamentParams = (t: Pick<Tournament, 'year' | 'slug'>) => ({ year: String(t.year), slug: t.slug });

export const finalsOf = (list: readonly Tournament[] | undefined) => list?.find((t) => t.level === 'Finals');

export const knownFinalsCity = (t: Pick<Tournament, 'city'> | undefined) => (t?.city && t.city !== TBC ? t.city : null);

export const finalsCity = (t: Pick<Tournament, 'city'> | undefined) => knownFinalsCity(t) ?? FINALS_FALLBACK;

export const qualifyTip = (city: string | null) =>
  `Qualifying for the World Tour Finals${city ? ` in ${city}` : ''} — top 8 in the race, max. 2 per country`;

export const roadTo = (t: Pick<Tournament, 'city'> | undefined) => `Road to ${finalsCity(t)}`;

export const isHeld = (t: Pick<Tournament, 'cancelled'>) => !t.cancelled;

export const isDone = (t: Pick<Tournament, 'status'>) => t.status === 'done';

export const isLive = (t: Pick<Tournament, 'status'>) => t.status === 'live';

export const hasStarted = (t: Pick<Tournament, 'status'>) => isDone(t) || isLive(t);

export const hasWinners = (t: Tournament) => isDone(t) && t.champions.length > 0;

export const liveAndNext = (held: readonly Tournament[]) => ({
  live: held.find(isLive),
  next: held.find((t) => t.status === 'up'),
});
