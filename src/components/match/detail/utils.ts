import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { MatchStats } from '~/api/bwf/normalize';
import { numberFormat } from '~/i18n/current';
import type { Game, Match, PlayerMatch, Side } from '~/types';
import { date, formatDayMonth, formatDayMonthYear } from '~/utils/dates';
import { formatDuration, formatNumber, formatRank, formatRecord, joinDots } from '~/utils/format';
import type { H2HRecord, OtherMeet, WL } from '~/utils/h2h';
import { gameDone, LONGEST_RUN } from '~/utils/live';
import { courtLabel, opposite, roundName } from '~/utils/matches';

import type { FormItem } from '../Outcome';

export interface SplitRow {
  key: string;
  label: MessageDescriptor;
  a: number;
  b: number;
  fa?: string;
  fb?: string;
  sa?: string;
  sb?: string;
  bar?: boolean;
  neutral?: boolean;
}

export interface StatView {
  rows: SplitRow[];
}

export interface CompareRow {
  key: string;
  label: MessageDescriptor;
  a: string;
  b: string;
  aBetter: boolean;
  bBetter: boolean;
}

export interface Meeting {
  key: string;
  tour: string;
  stage: string;
  venue?: string;
  dur?: string;
  won: boolean;
  games: readonly Game[];
}

const both = <T>(f: (s: Side) => T) => [f(0), f(1)] as const;

const lead = (g: Game, s: Side) => g[s] - g[opposite(s)];

const flipGames = (games: readonly Game[]) => games.map(([x, y]) => [y, x] as const);

const PERCENT = { style: 'percent', maximumFractionDigits: 0 } as const;

export const percent = (a: number, t: number) => numberFormat(PERCENT).format(t ? a / t : 0);

export const shareOf = (a: number, b: number) => (a + b ? (a / (a + b)) * 100 : 50);

export const metaLead = (m: Match) => joinDots([m.date && date(m.date).format('ddd'), courtLabel(m.court)]);

const margin = (x: number) => (x > 0 ? `+${formatNumber(x)}` : '—');

export const HEAD_TO_HEAD = msg({
  message: 'Head-to-head',
  comment: 'Match detail section comparing the two sides’ records against each other',
});
export const THIS_SEASON = msg({ message: 'This season', comment: 'Head-to-head toggle: only meetings this season' });
export const ALL_TIME = msg({
  message: 'All time',
  comment: 'Head-to-head toggle: every meeting between the two sides, not just this season',
});
export const FORM = msg({
  message: 'Form',
  comment: 'Head-to-head row: each side’s results in their last five matches',
});

const GAME_POINTS = msg({
  message: 'Game points',
  comment: 'Match stats row: how many times each side was one point away from winning a game',
});
const CHALLENGES_USED = msg({
  message: 'Challenges used',
  comment: 'Match stats row: how many line-call challenges (video reviews) each side asked for',
});
const CHALLENGES_WON = msg({
  message: 'Challenges won',
  comment: 'Match stats row: how many line-call challenges (video reviews) each side won',
});

const POINTS_WON = msg({ message: 'Points won', comment: 'Match stats row: total rallies won by each side' });
const BIGGEST_MARGIN = msg({
  message: 'Biggest game margin',
  comment: 'Match stats row: the largest points lead each side won a game by',
});
const WINNING_MARGIN = msg({
  message: 'Winning margin',
  comment: 'Game stats row: how many points the game was won by',
});

const pointsRow = (a: number, b: number): SplitRow => ({
  key: 'p',
  label: POINTS_WON,
  a,
  b,
  sa: percent(a, a + b),
  sb: percent(b, a + b),
  bar: true,
});

const marginRow = (label: MessageDescriptor, a: number, b: number): SplitRow => ({
  key: 'm',
  label,
  a,
  b,
  fa: margin(a),
  fb: margin(b),
});

const NO_STATS: StatView = { rows: [] };

const apiRows = (stats: MatchStats | null): SplitRow[] => {
  if (!stats) return [];
  const [x, y] = stats;
  return [
    { key: 'run', label: LONGEST_RUN, a: x.longestRun, b: y.longestRun },
    { key: 'gp', label: GAME_POINTS, a: x.gamePoints, b: y.gamePoints },
    { key: 'cu', label: CHALLENGES_USED, a: x.challenges.used, b: y.challenges.used, neutral: true },
    { key: 'cw', label: CHALLENGES_WON, a: x.challenges.won, b: y.challenges.won },
  ];
};

export const statView = (games: readonly Game[], tab: number, stats: MatchStats | null): StatView => {
  if (!games.length) return NO_STATS;
  if (tab === 0) {
    const done = games.filter(gameDone);
    const [pA, pB] = both((s) => games.reduce((x, g) => x + g[s], 0));
    const [mA, mB] = both((s) => Math.max(0, ...done.map((g) => lead(g, s))));
    return {
      rows: [pointsRow(pA, pB), ...apiRows(stats), marginRow(BIGGEST_MARGIN, mA, mB)],
    };
  }
  const g = games[tab - 1];
  if (!g) return NO_STATS;
  const [a, b] = g;
  const rows = [pointsRow(a, b), ...apiRows(stats)];
  if (gameDone(g)) rows.push(marginRow(WINNING_MARGIN, lead(g, 0), lead(g, 1)));
  return { rows };
};

export const formItems = (list: readonly PlayerMatch[]): FormItem[] =>
  list.map((pm) => ({ key: pm.key, outcome: pm.outcome === 'W' ? 'W' : 'L' }));

const venueOf = (pm: PlayerMatch) => joinDots([pm.tournament.venue, courtLabel(pm.match.court)]) || undefined;

const toMeeting = (pm: PlayerMatch, full: boolean): Meeting => ({
  key: pm.key,
  tour: pm.tournament.shortTitle,
  stage: `${roundName(pm.match.round)} · ${(full ? formatDayMonthYear : formatDayMonth)(pm.match.date)}`,
  ...(full ? { venue: venueOf(pm), dur: formatDuration(pm.match.durationMin) || undefined } : {}),
  won: pm.outcome === 'W',
  games: pm.side ? flipGames(pm.match.games) : pm.match.games,
});

export const toMeetings = (list: readonly PlayerMatch[], full: boolean): Meeting[] =>
  list.map((pm) => toMeeting(pm, full));

const otherMeeting = (o: OtherMeet): Meeting => ({
  key: o.key,
  tour: o.tournament,
  stage: joinDots([roundName(o.round), o.date && formatDayMonthYear(o.date)]),
  venue: o.venue ?? undefined,
  dur: (o.durationMin && formatDuration(o.durationMin)) || undefined,
  won: o.won,
  games: o.games,
});

export const allMeetings = (record: H2HRecord): Meeting[] =>
  [
    ...record.meets.map((pm) => ({ date: pm.match.date, meet: toMeeting(pm, true) })),
    ...record.others.map((o) => ({ date: o.date, meet: otherMeeting(o) })),
  ]
    .sort((x, y) => y.date.localeCompare(x.date))
    .map((x) => x.meet);

export const rankRow = (key: string, label: MessageDescriptor, x: number, y: number): CompareRow => ({
  key,
  label,
  a: formatRank(x),
  b: formatRank(y),
  aBetter: x && y ? x < y : !!x && !y,
  bBetter: x && y ? x > y : !x && !!y,
});

const wl = ([w, l]: WL) => formatRecord(w, l);

export const wlRow = (key: string, label: MessageDescriptor, x: WL, y: WL): CompareRow => {
  const ra = x[0] / Math.max(1, x[0] + x[1]);
  const rb = y[0] / Math.max(1, y[0] + y[1]);
  return { key, label, a: wl(x), b: wl(y), aBetter: ra > rb, bBetter: rb > ra };
};
