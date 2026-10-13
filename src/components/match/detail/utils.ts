import type { Game, Match, PlayerMatch, Side } from '~/types';
import { date, formatDayMonth, formatDayMonthYear } from '~/utils/dates';
import { formatDuration, formatRank } from '~/utils/format';
import { gameWon, noteLabel, opposite, roundName } from '~/utils/matches';

export interface SplitRow {
  key: string;
  label: string;
  a: number;
  b: number;
  fa?: string;
  fb?: string;
  neutral?: boolean;
}

export interface CompareRow {
  key: string;
  label: string;
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

export interface FormItem {
  key: string;
  outcome: 'W' | 'L';
}

type WL = readonly [number, number];

const both = <T>(f: (s: Side) => T) => [f(0), f(1)] as const;

const lead = (g: Game, s: Side) => g[s] - g[opposite(s)];

const flipGames = (games: readonly Game[]) => games.map(([x, y]) => [y, x] as const);

export const percent = (a: number, t: number, empty = '0%') => (t ? `${Math.round((a / t) * 100)}%` : empty);

export const metaLead = (m: Match) =>
  [m.date ? date(m.date).format('ddd') : '', m.court ? `Court ${m.court}` : ''].filter(Boolean).join(' · ');

const SCHEDULED = 'Scheduled';

export const statusLine = (m: Match) => {
  if (m.status === 'P') return ['Live', formatDuration(m.durationMin)].filter(Boolean).join(' · ');
  if (m.status === 'N') return m.time ? `${SCHEDULED} · not before` : SCHEDULED;
  return ['Finished', noteLabel(m.note, 'long'), formatDuration(m.durationMin)].filter(Boolean).join(' · ');
};

export const statRows = (games: readonly Game[], tab: number): SplitRow[] => {
  if (!games.length) return [];
  if (tab === 0) {
    const [gwA, gwB] = both((s) => games.filter((g) => gameWon(g, s)).length);
    const [pA, pB] = both((s) => games.reduce((x, g) => x + g[s], 0));
    const [mA, mB] = both((s) => Math.max(0, ...games.map((g) => lead(g, s))));
    return [
      { key: 'g', label: 'Games won', a: gwA, b: gwB },
      { key: 'p', label: 'Points won', a: pA, b: pB },
      { key: 's', label: 'Share of points', a: pA, b: pB, fa: percent(pA, pA + pB), fb: percent(pB, pA + pB) },
      { key: 'm', label: 'Biggest game win', a: mA, b: mB, fa: mA ? `+${mA}` : '—', fb: mB ? `+${mB}` : '—' },
    ];
  }
  const g = games[tab - 1];
  if (!g) return [];
  const [a, b] = g;
  const t = a + b;
  return [
    { key: 'sc', label: 'Score', a, b },
    { key: 'sh', label: 'Share of points', a, b, fa: percent(a, t), fb: percent(b, t) },
    { key: 'pp', label: 'Points played', a: t, b: t, neutral: true },
  ];
};

export const formItems = (list: readonly PlayerMatch[]): FormItem[] =>
  list.map((pm) => ({ key: pm.key, outcome: pm.outcome === 'W' ? 'W' : 'L' }));

const venueOf = (pm: PlayerMatch) =>
  [pm.tournament.venue, pm.match.court ? `Court ${pm.match.court}` : ''].filter(Boolean).join(' · ') || undefined;

export const toMeetings = (list: readonly PlayerMatch[], full: boolean): Meeting[] =>
  list.map((pm) => ({
    key: pm.key,
    tour: pm.tournament.shortTitle,
    stage: `${roundName(pm.match.round)} · ${(full ? formatDayMonthYear : formatDayMonth)(pm.match.date)}`,
    ...(full ? { venue: venueOf(pm), dur: formatDuration(pm.match.durationMin) || undefined } : {}),
    won: pm.outcome === 'W',
    games: pm.side ? flipGames(pm.match.games) : pm.match.games,
  }));

export const rankRow = (key: string, label: string, x: number, y: number): CompareRow => ({
  key,
  label,
  a: formatRank(x),
  b: formatRank(y),
  aBetter: x && y ? x < y : !!x && !y,
  bBetter: x && y ? x > y : !x && !!y,
});

export const wlRow = (key: string, label: string, x: WL, y: WL): CompareRow => {
  const ra = x[0] / Math.max(1, x[0] + x[1]);
  const rb = y[0] / Math.max(1, y[0] + y[1]);
  return { key, label, a: `${x[0]}–${x[1]}`, b: `${y[0]}–${y[1]}`, aBetter: ra > rb, bBetter: rb > ra };
};
