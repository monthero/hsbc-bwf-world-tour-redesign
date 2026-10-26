import type { Game, Match, PlayerMatch, SeasonIndex } from '~/types';

import { opposite, teamEventKey, winnerSide } from './matches';
import { winLoss } from './season';

export type WL = readonly [number, number];

export interface OtherMeet {
  key: string;
  tournament: string;
  round: string;
  date: string;
  venue: string | null;
  durationMin: number | null;
  won: boolean;
  games: readonly Game[];
}

export const meetKey = (tournament: string, match: string | null) => `${tournament.toUpperCase()}|${match ?? ''}`;

export interface H2HRecord {
  a: number;
  b: number;
  pa: number;
  pb: number;
  careerA: WL;
  careerB: WL;
  meets: readonly PlayerMatch[];
  others: readonly OtherMeet[];
  allEvents: boolean;
}

const NONE: readonly PlayerMatch[] = [];

export const teamHistory = (index: SeasonIndex | undefined, match: Match, side: 0 | 1) =>
  index?.teams.get(teamEventKey(match.event, match.teams[side].key)) ?? NONE;

export const meetingsVs = (teamMatches: readonly PlayerMatch[], match: Match, code: string) => {
  const opponent = match.teams[1].key;
  return teamMatches.filter(
    (pm) =>
      winnerSide(pm.match) !== null &&
      pm.match.teams[opposite(pm.side)].key === opponent &&
      !(pm.tournament.code === code && pm.match.id === match.id),
  );
};

export const careerRecord = (index: SeasonIndex, match: Match, code: string): H2HRecord => {
  const listA = teamHistory(index, match, 0);
  const meets = meetingsVs(listA, match, code);
  let pa = 0;
  let pb = 0;
  for (const pm of meets)
    for (const g of pm.match.games) {
      pa += g[pm.side];
      pb += g[opposite(pm.side)];
    }
  const [a, b] = winLoss(meets);
  return {
    a,
    b,
    pa,
    pb,
    careerA: winLoss(listA),
    careerB: winLoss(teamHistory(index, match, 1)),
    meets,
    others: [],
    allEvents: false,
  };
};

export const withOtherMeets = (
  record: H2HRecord,
  others: readonly OtherMeet[],
  match: Match,
  code: string,
): H2HRecord => {
  const known = new Set([
    meetKey(code, match.code),
    ...record.meets.map((pm) => meetKey(pm.tournament.code, pm.match.code)),
  ]);
  const extra = others.filter((o) => !known.has(o.key));
  let { a, b, pa, pb } = record;
  for (const o of extra) {
    if (o.won) a++;
    else b++;
    for (const [x, y] of o.games) {
      pa += x;
      pb += y;
    }
  }
  return { ...record, a, b, pa, pb, others: extra, allEvents: true };
};
