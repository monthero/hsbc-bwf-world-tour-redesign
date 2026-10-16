import { msg } from '@lingui/core/macro';

import { translate } from '~/i18n/lazy';
import type { CurrentRank, EventCode } from '~/types';

import { foldText } from './names';

export const searchKey = (...parts: readonly string[]) =>
  ` ${foldText(parts.join(' '))
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()}`;

export interface SearchQuery {
  terms: readonly string[];
  phrase: string;
}

export const parseQuery = (query: string): SearchQuery => {
  const phrase = searchKey(query);
  return { terms: phrase.split(' ').filter(Boolean), phrase };
};

const NO_MATCH = -1;

const keyScore = (key: string, { terms, phrase }: SearchQuery) => {
  if (key === phrase) return 0;
  if (key.startsWith(phrase)) return 1;
  if (terms.every((t) => key.includes(` ${t}`))) return 2;
  return terms.every((t) => key.includes(t)) ? 3 : NO_MATCH;
};

const matchScore = (keys: readonly string[], q: SearchQuery) =>
  keys.reduce((best, key) => {
    const s = keyScore(key, q);
    return s === NO_MATCH || (best !== NO_MATCH && best <= s) ? best : s;
  }, NO_MATCH);

export const rankHits = <T extends { keys: readonly string[] }>(
  items: readonly T[],
  q: SearchQuery,
  relevance: (a: T, b: T) => number,
  limit: number,
): T[] =>
  items
    .flatMap((item) => {
      const score = matchScore(item.keys, q);
      return score === NO_MATCH ? [] : [{ item, score }];
    })
    .sort((a, b) => a.score - b.score || relevance(a.item, b.item))
    .slice(0, limit)
    .map((h) => h.item);

export interface RankMark {
  rank: number;
  ev: EventCode;
}

const bestOf = (ranks: readonly CurrentRank[], pick: (r: CurrentRank) => number | null): RankMark | null =>
  ranks.reduce<RankMark | null>((best, r) => {
    const rank = pick(r);
    return rank && (!best || rank < best.rank) ? { rank, ev: r.ev } : best;
  }, null);

export interface PlayerStanding {
  current: RankMark | null;
  high: RankMark | null;
}

export const playerStanding = (ranks: readonly CurrentRank[] = []): PlayerStanding => ({
  current: bestOf(ranks, (r) => r.r),
  high: bestOf(ranks, (r) => r.hi),
});

const UNRANKED = Number.MAX_SAFE_INTEGER;

export const byStanding = (a: PlayerStanding, b: PlayerStanding) =>
  (a.current?.rank ?? UNRANKED) - (b.current?.rank ?? UNRANKED) ||
  (a.high?.rank ?? UNRANKED) - (b.high?.rank ?? UNRANKED);

const WORLD_RANK = msg({
  message: 'WR #{rank} · {event}',
  comment:
    'Search result hint: the player’s current BWF world ranking and discipline code, e.g. "WR #3 · MS". WR is short for world ranking; keep it short',
});

const CAREER_HIGH = msg({
  message: 'Career high #{rank} · {event}',
  comment:
    'Search result hint: the best world ranking the player ever reached, and the discipline code, e.g. "Career high #1 · WD"',
});

export const standingHint = ({ current, high }: PlayerStanding) => {
  if (current) return translate(WORLD_RANK, { rank: current.rank, event: current.ev });
  return high ? translate(CAREER_HIGH, { rank: high.rank, event: high.ev }) : null;
};
