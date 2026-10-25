import type { TournamentRanks } from '~/api/schemas';
import { QUALIFY_PER_COUNTRY, QUALIFY_SPOTS } from '~/constants';
import type {
  CurrentRank,
  EventCode,
  Player,
  PlayerDirectory,
  QualifyStatus,
  RaceRankings,
  RankedPlayer,
  RankingPlayer,
  RankingRow,
  RankRow,
  RankView,
  SeasonIndex,
} from '~/types';

import { weakCached } from './cache';
import { foldText, toPlayer } from './names';
import { playerById } from './season';

export type Qualifiers = Partial<Record<EventCode, Set<number>>>;

type RaceRows = RaceRankings['players'][string];

const bestRank = (players: readonly Player[], rankOf: (p: Player) => number) => {
  let best = 0;
  for (const p of players) {
    const r = rankOf(p);
    if (r > 0 && (!best || r < best)) best = r;
  }
  return best;
};

export const worldRank = (dir: PlayerDirectory | undefined, players: readonly Player[], ev: EventCode) =>
  bestRank(players, (p) => dir?.get(p.id)?.ranks?.find((c) => c.ev === ev)?.r ?? 0);

export const frozenRank = (ranks: TournamentRanks['ranks'], players: readonly Player[], ev: EventCode) =>
  bestRank(players, (p) => ranks[p.id]?.[ev] ?? 0);

export const raceRank = (race: RaceRankings | undefined, players: readonly Player[], ev: EventCode) => {
  for (const p of players) {
    const r = race?.players[p.id]?.find((x) => x.ev === ev)?.r;
    if (r) return r;
  }
  return 0;
};

const pickQualifiers = <T>(entries: readonly T[], countriesOf: (e: T) => readonly string[]): Set<T> => {
  const perCountry = new Map<string, number>();
  const ok = new Set<T>();
  for (const e of entries) {
    if (ok.size >= QUALIFY_SPOTS) break;
    const ccs = countriesOf(e);
    if (ccs.some((cc) => (perCountry.get(cc) ?? 0) >= QUALIFY_PER_COUNTRY)) continue;
    for (const cc of ccs) perCountry.set(cc, (perCountry.get(cc) ?? 0) + 1);
    ok.add(e);
  }
  return ok;
};

const isBlocked = (rank: number, qualified: boolean) => !qualified && rank <= QUALIFY_SPOTS;

const buildQualifiers = (race: RaceRankings, index: SeasonIndex): Qualifiers => {
  const byEv = new Map<EventCode, Map<number, Set<string>>>();
  for (const [id, rows] of Object.entries(race.players)) {
    const cc = index.players.get(id)?.cc;
    for (const x of rows) {
      let ranks = byEv.get(x.ev);
      if (!ranks) byEv.set(x.ev, (ranks = new Map()));
      let ccs = ranks.get(x.r);
      if (!ccs) ranks.set(x.r, (ccs = new Set()));
      if (cc) ccs.add(cc);
    }
  }
  const out: Qualifiers = {};
  for (const [ev, ranks] of byEv) {
    const sorted = [...ranks.keys()].sort((a, b) => a - b);
    out[ev] = pickQualifiers(sorted, (r) => [...(ranks.get(r) ?? [])]);
  }
  return out;
};

const qualifiersByRace = weakCached((race: RaceRankings) =>
  weakCached((index: SeasonIndex) => buildQualifiers(race, index)),
);

export const raceQualifiers = (race: RaceRankings, index: SeasonIndex) => qualifiersByRace(race)(index);

export const buildRanks = (
  current: CurrentRank[],
  raceRows: RaceRows | undefined,
  qualifiers: Qualifiers | undefined,
  index: SeasonIndex | undefined,
  dir?: PlayerDirectory,
): RankView[] => {
  const ranked = current.some((c) => c.r) ? current.filter((c) => c.r) : current;
  return ranked.map((c) => {
    const rc = raceRows?.find((x) => x.ev === c.ev);
    const q = qualifiers?.[c.ev];
    const qualified = !!rc && !!q?.has(rc.r);
    return {
      ev: c.ev,
      rank: c.r,
      change: c.r && c.pr ? c.pr - c.r : 0,
      race: rc
        ? {
            rank: rc.r,
            change: rc.pr ? rc.pr - rc.r : 0,
            points: rc.pts,
            qualified,
            blocked: !!q && isBlocked(rc.r, qualified),
          }
        : null,
      partner: c.r && c.w ? playerById(c.wid, c.w, index, dir) : null,
      highest: c.hi,
      highestPartner: c.hw ? playerById(c.hwid, c.hw, index, dir) : null,
      samePartner: !!c.hw && (c.hwid || c.hw) === (c.wid || c.w),
    };
  });
};

const toRanked = (p: RankingPlayer): RankedPlayer => ({
  ...toPlayer(p.name, p.cc, p.id),
  known: p.known,
  photo: p.photo,
});

export const isKnown = (p: Player) => 'known' in p && p.known === true;

const toRow = (r: RankingRow): RankRow => {
  const players = r.players.map(toRanked);
  return {
    key: players.map((p) => p.id).join('-'),
    rank: r.rank,
    change: r.prev ? r.prev - r.rank : 0,
    isNew: r.prev === null,
    points: r.points,
    tournaments: r.tournaments,
    players,
    countries: [...new Set(players.map((p) => p.cc).filter(Boolean))],
    text: foldText(players.map((p) => p.raw).join(' ')),
    qualify: null,
    cutoff: false,
  };
};

const statusOf = (row: RankRow, qualified: boolean): QualifyStatus => {
  if (qualified) return 'qualified';
  return isBlocked(row.rank, qualified) ? 'blocked' : null;
};

export const buildRankRows = (rows: readonly RankingRow[], race: boolean): RankRow[] => {
  const out = rows.map(toRow);
  if (!race) return out;
  const ok = pickQualifiers(out, (r) => r.countries);
  let last: RankRow | undefined;
  for (const r of out) {
    const q = ok.has(r);
    r.qualify = statusOf(r, q);
    if (q) last = r;
  }
  if (last) last.cutoff = true;
  return out;
};
