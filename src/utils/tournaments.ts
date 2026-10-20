import { msg } from '@lingui/core/macro';

import { LEVEL_META } from '~/constants';
import { numberFormat } from '~/i18n/current';
import { lazyRecord, translate } from '~/i18n/lazy';
import type { CalendarEventDto, Level, Tournament, TournamentMatches } from '~/types';

import { countryCode, countryName } from './countries';
import { date, dayjs, formatDateRange, ISO_DAY, today, type Dayjs } from './dates';
import { formatNumber } from './format';
import { tournamentHeaderUrl, tournamentLogoUrl } from './images';
import { matchClock, matchInstant, SOON_MIN, type ClockPrefs } from './match-time';
import { finalDayOver, firstMatchOf, hasMatchOnCourt, playHasBegun } from './matches';
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

const STARTING_SOON = msg({
  message: 'Starting soon',
  comment: 'Countdown: the first match of the tournament is less than an hour away (or running a little late)',
});

const STARTS_TODAY = {
  short: msg({
    message: 'Today',
    context: 'tournament start',
    comment: 'Very short countdown tag: the tournament starts today. Use your shortest form',
  }),
  in: msg({ message: 'Today', context: 'tournament start', comment: 'Countdown: the tournament starts today' }),
  long: msg({ message: 'Starts today', comment: 'Countdown: the tournament starts today' }),
} as const;

const STARTS_TODAY_AT = {
  in: msg({
    message: 'Today at {time}',
    comment: 'Countdown: the tournament’s first match is today at {time}, e.g. "Today at 10:00"',
  }),
  long: msg({
    message: 'Starts today at {time}',
    comment: 'Countdown: the tournament’s first match is today at {time}, e.g. "Starts today at 10:00"',
  }),
} as const;

const SOON_TAG = msg({
  message: 'Soon',
  context: 'tournament start',
  comment: 'Very short countdown tag: the tournament’s first match is less than an hour away. Use your shortest form',
});

type CountdownForm = 'long' | 'in' | 'short';

const startLabel = (t: Pick<Tournament, 'daysUntil' | 'startsAt' | 'startsSoon'>, form: CountdownForm) => {
  if (t.startsSoon) return translate(form === 'short' ? SOON_TAG : STARTING_SOON);
  if (t.startsAt && form !== 'short') return translate(STARTS_TODAY_AT[form], { time: t.startsAt });
  return t.startsAt || t.daysUntil <= 0 ? translate(STARTS_TODAY[form]) : null;
};

export const countdownLabel = (
  t: Pick<Tournament, 'daysUntil' | 'startsAt' | 'startsSoon'>,
  form: CountdownForm = 'long',
) => {
  const starting = startLabel(t, form);
  if (starting) return starting;
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

const LEVEL_RANK: Record<Level, number> = { Finals: 4, '1000': 3, '750': 2, '500': 1, '300': 0 };

const byLivePriority = (a: Tournament, b: Tournament) =>
  Number(!!b.onCourt) - Number(!!a.onCourt) || LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || a.index - b.index;

export const pickLive = (list: readonly Tournament[]) => list.filter(isLive).sort(byLivePriority)[0];

export const liveAndNext = (held: readonly Tournament[]) => ({
  live: pickLive(held),
  next: held.find((t) => t.status === 'up'),
});

export const inStatusWindow = (t: Pick<Tournament, 'start' | 'end' | 'cancelled'>) => {
  const now = today();
  return (
    !t.cancelled && t.start <= now.add(1, 'day').format(ISO_DAY) && t.end >= now.subtract(1, 'day').format(ISO_DAY)
  );
};

const asLive = (t: Tournament, onCourt: boolean): Tournament => ({
  ...t,
  status: 'live',
  dayNumber: Math.min(Math.max(t.dayNumber, 1), t.totalDays),
  onCourt,
});

export const resolveTournament = (t: Tournament, data: TournamentMatches | null | undefined): Tournament => {
  const opening = t.status === 'live' && t.dayNumber === 1;
  if (data === undefined) return opening ? { ...t, status: 'up' } : t;
  if (data === null || data.stale) return t;
  const onCourt = hasMatchOnCourt(data);
  if (t.status === 'done') return onCourt ? asLive(t, true) : t;
  if (playHasBegun(data)) return finalDayOver(t.end, data) ? { ...t, status: 'done' } : asLive(t, onCourt);
  if (t.status === 'live' && !opening) return t;
  return { ...t, status: 'up', firstMatch: firstMatchOf(t, data) };
};

const firstMatchAt = (t: Tournament) => (t.status === 'up' && t.firstMatch ? matchInstant(t.firstMatch) : null);

export const isStartingSoon = (t: Tournament, now: Dayjs) => {
  const at = firstMatchAt(t);
  return !!at && at.diff(now, 'minute') <= SOON_MIN;
};

export const withStart = (t: Tournament, prefs: ClockPrefs, soon: boolean): Tournament => {
  const at = firstMatchAt(t);
  const clock = t.firstMatch && matchClock(t.firstMatch, prefs);
  if (!at || !clock) return t;
  const sameDay = at.local().format(ISO_DAY) === dayjs().format(ISO_DAY);
  return {
    ...t,
    startsSoon: soon,
    startsAt: sameDay ? [clock.text, clock.zone].filter(Boolean).join(' ') : undefined,
  };
};

export const tournamentLink = (t: Pick<Tournament, 'year' | 'slug'>) =>
  ({ to: '/world-tour/$year/$slug', params: tournamentParams(t) }) as const;

const NEXT_TOURNAMENT = msg({
  message: 'Next · {when}',
  comment: 'The next tournament on the calendar and when it starts, e.g. "Next · In 5 days" or "Next · Tomorrow"',
});

export const liveOrNextLabel = (t: Tournament) =>
  isLive(t) ? liveDayLabel(t) : translate(NEXT_TOURNAMENT, { when: countdownLabel(t, 'in') });
