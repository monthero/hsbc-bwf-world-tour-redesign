import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { DrawSlot, EventCode, Match, Side, Team, TournamentSchedule } from '~/types';
import { date } from '~/utils/dates';
import { isDoubles, roundName, winnerSide } from '~/utils/matches';

import { DAY_ROUNDS } from '../../constants';

const DRAW_ROUNDS = [
  {
    id: 'R32',
    label: msg({ message: 'Round of 32', comment: 'Draw column heading: the knockout round with 32 players or pairs' }),
    size: 16,
  },
  {
    id: 'R16',
    label: msg({ message: 'Round of 16', comment: 'Draw column heading: the knockout round with 16 players or pairs' }),
    size: 8,
  },
  {
    id: 'QF',
    label: msg({ message: 'Quarter-finals', comment: 'Draw column heading: the round of the last eight' }),
    size: 4,
  },
  {
    id: 'SF',
    label: msg({ message: 'Semi-finals', comment: 'Draw column heading: the round of the last four' }),
    size: 2,
  },
  {
    id: 'F',
    label: msg({ message: 'Final', comment: 'Draw column heading: the last match of an event' }),
    size: 1,
  },
] as const;

type DrawRound = (typeof DRAW_ROUNDS)[number];

export const GAP = 52;
const GG = 18;
const FX = 8;
const LINE = 16;
const ROW_PAD = 10;
const MATCH_GAP = 5;

export interface BracketBox {
  key: string;
  match: Match | null;
  teams: [Team | null, Team | null];
  win: Side | -1;
  bye: boolean;
}

interface BracketPath {
  key: string;
  d: string;
  win: boolean;
}

interface BracketColumn {
  id: string;
  label: string;
  short: string;
  day: string;
  active: boolean;
  boxes: BracketBox[];
  ys: number[];
  paths: BracketPath[];
}

export interface Bracket {
  columns: BracketColumn[];
  height: number;
  boxHeight: number;
}

const sameTeam = (a: Team, b: Team) => a.key !== '' && a.key === b.key;

const orderRounds = (rounds: readonly DrawRound[], matches: Match[]) => {
  const byRound = rounds.map((r) => matches.filter((m) => m.round === r.id));
  const cols = rounds.map((r) => Array.from<Match | null>({ length: r.size }).fill(null));
  const top = byRound.findLastIndex((l) => l.length > 0);
  if (top < 0) return cols;
  byRound[top]?.slice(0, rounds[top]?.size).forEach((m, j) => {
    const col = cols[top];
    if (col) col[j] = m;
  });
  for (let i = top - 1; i >= 0; i--) {
    const pool = [...(byRound[i] ?? [])];
    const col = cols[i] ?? [];
    const parents = cols[i + 1] ?? [];
    parents.forEach((m, j) =>
      m?.teams.forEach((t, k) => {
        const x = pool.findIndex((p) => p.teams.some((pt) => sameTeam(pt, t)));
        if (x >= 0) col[2 * j + k] = pool.splice(x, 1)[0] ?? null;
      }),
    );
    const free = col.map((_, j) => j).filter((j) => !col[j]);
    free.sort((a, b) => Number(!!parents[a >> 1]) - Number(!!parents[b >> 1]) || a - b);
    pool.forEach((m, n) => {
      const j = free[n];
      if (j !== undefined) col[j] = m;
    });
  }
  return cols;
};

const placeRounds = (rounds: readonly DrawRound[], slots: readonly DrawSlot[]) =>
  rounds.map((r) => {
    const col = Array.from<Match | null>({ length: r.size }).fill(null);
    for (const s of slots) if (s.match.round === r.id && s.slot < r.size) col[s.slot] = s.match;
    return col;
  });

const winnerOf = (b: BracketBox | undefined) => (b && b.win !== -1 ? b.teams[b.win] : null) ?? null;

const isBye = (m: Match) => m.status === 'F' && m.teams.some((t) => !t.players.length);

const buildBoxes = (rounds: readonly DrawRound[], cols: (Match | null)[][]) => {
  const out: BracketBox[][] = [];
  cols.forEach((col, i) => {
    const prev = out[i - 1];
    const filled = (t: Team, j: number): Team | null => (t.players.length ? t : winnerOf(prev?.[j]));
    out.push(
      col.map((m, j): BracketBox => {
        const key = `${rounds[i]?.id}-${j}`;
        if (m) {
          const teams: [Team | null, Team | null] = [filled(m.teams[0], 2 * j), filled(m.teams[1], 2 * j + 1)];
          const bye = isBye(m);
          return { key, match: bye ? null : m, teams, win: winnerSide(m) ?? -1, bye };
        }
        const parent = cols[i + 1]?.[j >> 1];
        if (parent) return { key, match: null, teams: [parent.teams[j & 1] ?? null, null], win: 0, bye: true };
        const teams: [Team | null, Team | null] = prev
          ? [winnerOf(prev[2 * j]), winnerOf(prev[2 * j + 1])]
          : [null, null];
        return { key, match: null, teams, win: -1, bye: false };
      }),
    );
  });
  return out;
};

const connectorPaths = (boxes: BracketBox[], ys: number[], next: number[], off: number) =>
  boxes
    .flatMap((b, j): BracketPath[] => {
      const yc = ys[j] ?? 0;
      const y1 = next[j >> 1] ?? 0;
      const stubs = ([0, 1] as const).map((r) => {
        const y0 = yc + (r ? off : -off);
        return {
          key: `${j}-${r}`,
          d: `M0 ${y0} H${FX - 4} Q${FX} ${y0} ${FX} ${y0 + (r ? -4 : 4)} V${yc}`,
          win: b.win === r,
        };
      });
      const mx = GAP / 2;
      const dy = y1 - yc;
      const rr = Math.min(8, Math.abs(dy) / 2);
      const sg = Math.sign(dy);
      const d = dy
        ? `M${FX} ${yc} H${mx - rr} Q${mx} ${yc} ${mx} ${yc + sg * rr} V${y1} H${GAP}`
        : `M${FX} ${yc} H${GAP}`;
      return [...stubs, { key: `${j}-o`, d, win: b.win >= 0 }];
    })
    .sort((a, b) => Number(a.win) - Number(b.win));

const roundDay = (schedule: TournamentSchedule, ev: EventCode, id: string) => {
  const m =
    schedule.matches.find((x) => x.round === id && x.event === ev) ?? schedule.matches.find((x) => x.round === id);
  const iso =
    m?.date ?? schedule.days.find((d) => d.roundsLabel.split(' · ').includes(roundName(id)))?.date ?? undefined;
  return iso ? date(iso).format('dddd, D MMMM') : '';
};

const activeRound = (schedule: TournamentSchedule) => {
  const today = schedule.days[schedule.focusIndex]?.matches ?? [];
  return (today.find((m) => m.status === 'P') ?? today.find((m) => m.status === 'N') ?? today[0])?.round;
};

export const isBracketMatch = (m: Pick<Match, 'round'>) => DRAW_ROUNDS.some((r) => r.id === m.round);

export const hasDraw = (schedule: TournamentSchedule, draw: readonly DrawSlot[] | null, ev: EventCode) =>
  draw ? draw.some((s) => s.match.event === ev) : schedule.matches.some((m) => m.event === ev && isBracketMatch(m));

const drawRounds = (matches: Match[]) => {
  const first = DRAW_ROUNDS.findIndex((r) => matches.some((m) => m.round === r.id));
  return DRAW_ROUNDS.slice(Math.max(0, first));
};

export const buildBracket = (
  schedule: TournamentSchedule,
  draw: readonly DrawSlot[] | null,
  ev: EventCode,
  live: boolean,
): Bracket => {
  const slots = draw?.filter((s) => s.match.event === ev);
  const matches = slots ? slots.map((s) => s.match) : schedule.matches.filter((m) => m.event === ev);
  const rounds = drawRounds(matches);
  const n = rounds[0]?.size ?? 1;
  const row = (isDoubles(ev) ? 2 : 1) * LINE + ROW_PAD;
  const bh = 2 * row + 3;
  const pitch = bh + MATCH_GAP;
  const off = (row + 1) / 2;
  const ys: number[][] = [Array.from({ length: n }, (_, j) => j * pitch + Math.floor(j / 2) * GG + bh / 2)];
  for (let i = 1; i < rounds.length; i++) {
    const p = ys[i - 1] ?? [];
    ys.push(Array.from({ length: p.length / 2 }, (_, j) => ((p[2 * j] ?? 0) + (p[2 * j + 1] ?? 0)) / 2));
  }
  const boxes = buildBoxes(rounds, slots ? placeRounds(rounds, slots) : orderRounds(rounds, matches));
  const active = live ? activeRound(schedule) : undefined;
  const columns = rounds.map((r, i): BracketColumn => {
    const bs = boxes[i] ?? [];
    const cy = ys[i] ?? [];
    const next = ys[i + 1];
    const short = DAY_ROUNDS[r.id]?.short;
    return {
      id: r.id,
      label: i18n._(r.label),
      short: short ? i18n._(short) : r.id,
      day: roundDay(schedule, ev, r.id),
      active: active === r.id,
      boxes: bs,
      ys: cy,
      paths: next ? connectorPaths(bs, cy, next, off) : [],
    };
  });
  return { columns, height: (n - 1) * pitch + Math.max(0, n / 2 - 1) * GG + bh, boxHeight: bh };
};
