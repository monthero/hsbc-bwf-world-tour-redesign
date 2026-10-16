import { msg } from '@lingui/core/macro';

import { LEVEL_META } from '~/constants';
import { numberFormat } from '~/i18n/current';
import { lazyRecord, translate } from '~/i18n/lazy';
import type { CalendarEventDto, Tournament } from '~/types';

import { countryCode, countryName } from './countries';
import { date, formatDateRange, today, type Dayjs } from './dates';
import { formatNumber } from './format';
import { tournamentHeaderUrl, tournamentLogoUrl } from './images';
import { toPlayer } from './names';

export const formatPrize = (n: number) => `$${formatNumber(n)}`;

const COMPACT = { notation: 'compact', maximumFractionDigits: 2 } as const;

export const formatPrizeShort = (n: number) => `$${numberFormat(COMPACT).format(n)}`;

const TBC = 'TBC';

const TBC_LABEL = msg({
  message: 'TBC',
  comment: 'Short for "to be confirmed": the prize money is not announced yet. Keep it short',
});

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
  const cc = countryCode(e.country);
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
    datesLong: formatDateRange(start, end, { long: true, year: true }),
    place: [e.city, cc ? countryName(cc) : e.country].filter(Boolean).join(', '),
    cc,
    prizeLabel: e.prize ? formatPrize(e.prize) : translate(TBC_LABEL),
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

const LIVE_DAY = msg({
  message: 'Live · Day {day}',
  comment: 'Status of a tournament being played now, with which day of it today is, e.g. "Live · Day 3"',
});

const LIVE_DAY_OF = msg({
  message: 'Live · Day {day} of {total}',
  comment: 'Status of a tournament being played now: which day of how many, e.g. "Live · Day 3 of 6"',
});

export const liveDayLabel = (t: Pick<Tournament, 'dayNumber' | 'totalDays'>, withTotal = true) =>
  translate(withTotal ? LIVE_DAY_OF : LIVE_DAY, { day: t.dayNumber, total: t.totalDays });

const COUNTDOWNS = {
  short: {
    one: msg({
      message: 'Tmrw',
      comment: 'Very short countdown tag: the tournament starts tomorrow. Abbreviate "Tomorrow" as much as possible',
    }),
    other: msg({
      message: '{count}d',
      comment: 'Very short countdown tag: the tournament starts in {count} days, e.g. "5d". Use your shortest form',
    }),
  },
  in: {
    one: msg({ message: 'Tomorrow', comment: 'Countdown: the tournament starts tomorrow' }),
    other: msg({
      message: '{count, plural, one {In # day} other {In # days}}',
      comment: 'Countdown: the tournament starts in this many days, e.g. "In 5 days"',
    }),
  },
  long: {
    one: msg({ message: 'Starts tomorrow', comment: 'Countdown: the tournament starts tomorrow' }),
    other: msg({
      message: '{count, plural, one {Starts in # day} other {Starts in # days}}',
      comment: 'Countdown: the tournament starts in this many days, e.g. "Starts in 5 days"',
    }),
  },
} as const;

export const countdownLabel = (t: Pick<Tournament, 'daysUntil'>, form: 'long' | 'in' | 'short' = 'long') => {
  const n = t.daysUntil;
  const messages = COUNTDOWNS[form];
  return translate(n === 1 ? messages.one : messages.other, { count: n });
};

const FIXED_LABELS: Partial<Record<Tournament['status'], string>> = lazyRecord({
  done: msg({ message: 'Completed', comment: 'Tournament status: it has finished' }),
  cancelled: msg({ message: 'Cancelled', context: 'tournament status', comment: 'The tournament will not take place' }),
});

export const statusLabel = (t: Tournament) => {
  if (t.status === 'live') return liveDayLabel(t);
  return FIXED_LABELS[t.status] ?? countdownLabel(t);
};

export const mapsUrl = (t: Tournament) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.venue ? `${t.venue}, ` : 'Badminton arena, '}${t.city}, ${t.country}`)}`;

export const tournamentParams = (t: Pick<Tournament, 'year' | 'slug'>) => ({ year: String(t.year), slug: t.slug });

export const finalsOf = (list: readonly Tournament[] | undefined) => list?.find((t) => t.level === 'Finals');

export const knownFinalsCity = (t: Pick<Tournament, 'city'> | undefined) => (t?.city && t.city !== TBC ? t.city : null);

const QUALIFY_TIP = msg({
  message: 'Qualifying for the World Tour Finals — top 8 in the race, max. 2 per country',
  comment:
    'Tooltip in the Race to Finals ranking (the season ranking that decides who plays the World Tour Finals): this player is on course to qualify. Only the top 8 qualify, with at most 2 per country',
});

const QUALIFY_TIP_IN = msg({
  message: 'Qualifying for the World Tour Finals in {city} — top 8 in the race, max. 2 per country',
  comment:
    'Tooltip in the Race to Finals ranking: this player is on course to qualify for the World Tour Finals held in {city}. Only the top 8 qualify, with at most 2 per country',
});

export const qualifyTip = (city: string | null) =>
  city ? translate(QUALIFY_TIP_IN, { city }) : translate(QUALIFY_TIP);

const ROAD_TO = msg({
  message: 'Road to {city}',
  comment:
    'Heading for the season-long race to qualify for the World Tour Finals, named after the host city, e.g. "Road to Hangzhou"',
});

const ROAD_TO_FINALS = msg({
  message: 'Road to the Finals',
  comment: 'Heading for the season-long race to qualify for the World Tour Finals, when the host city is not known',
});

export const roadTo = (t: Pick<Tournament, 'city'> | undefined) => {
  const city = knownFinalsCity(t);
  return city ? translate(ROAD_TO, { city }) : translate(ROAD_TO_FINALS);
};

export const isHeld = (t: Pick<Tournament, 'cancelled'>) => !t.cancelled;

export const isDone = (t: Pick<Tournament, 'status'>) => t.status === 'done';

export const isLive = (t: Pick<Tournament, 'status'>) => t.status === 'live';

export const hasStarted = (t: Pick<Tournament, 'status'>) => isDone(t) || isLive(t);

export const hasWinners = (t: Tournament) => isDone(t) && t.champions.length > 0;

export const liveAndNext = (held: readonly Tournament[]) => ({
  live: held.find(isLive),
  next: held.find((t) => t.status === 'up'),
});

export const tournamentLink = (t: Pick<Tournament, 'year' | 'slug'>) =>
  ({ to: '/world-tour/$year/$slug', params: tournamentParams(t) }) as const;

const NEXT_TOURNAMENT = msg({
  message: 'Next · {when}',
  comment: 'The next tournament on the calendar and when it starts, e.g. "Next · In 5 days" or "Next · Tomorrow"',
});

export const liveOrNextLabel = (t: Tournament) =>
  isLive(t) ? liveDayLabel(t) : translate(NEXT_TOURNAMENT, { when: countdownLabel(t, 'in') });
