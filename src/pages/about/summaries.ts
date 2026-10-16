import { msg } from '@lingui/core/macro';

import { DRAW_SIZE, LEVEL_POINTS, QUALIFY_SPOTS } from '~/constants';
import type { Player, RankRow, Tournament } from '~/types';
import { compareText } from '~/utils/names';
import { formatPrizeShort, hasWinners, isHeld } from '~/utils/tournaments';

import { TIER_LEVELS } from './constants';
import type { TierSummary, TitlesSummary } from './types';

const FINALS_DRAW = msg({
  message: `Top ${QUALIFY_SPOTS} per discipline`,
  comment:
    'About page tier ladder: the World Tour Finals field is the top {QUALIFY_SPOTS} players or pairs of the Race to Finals in each discipline',
});

const REGULAR_DRAW = msg({
  message: `${DRAW_SIZE} per draw`,
  comment: 'About page tier ladder: number of players or pairs in each discipline’s main draw',
});

const prizeRange = (prizes: readonly number[]) => {
  if (!prizes.length) return null;
  const min = Math.min(...prizes);
  const max = Math.max(...prizes);
  return min === max ? formatPrizeShort(max) : `${formatPrizeShort(min)}–${formatPrizeShort(max).slice(1)}`;
};

export const tierSummaries = (list: readonly Tournament[]): TierSummary[] => {
  const held = list.filter(isHeld);
  const tiers = TIER_LEVELS.flatMap((level) => {
    const events = held.filter((t) => t.level === level);
    const prizes = events.map((t) => t.prize).filter((p) => p > 0);
    return events.length ? [{ level, events, prizes, top: prizes.length ? Math.max(...prizes) : 0 }] : [];
  });
  const max = Math.max(1, ...tiers.map((t) => t.top));
  return tiers.map(({ level, events, prizes, top }) => ({
    level,
    events,
    prize: prizeRange(prizes),
    share: top / max,
    points: LEVEL_POINTS[level],
    draw: level === 'Finals' ? FINALS_DRAW : REGULAR_DRAW,
  }));
};

const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

const byCount = (a: [string, number], b: [string, number]) => b[1] - a[1] || compareText(a[0], b[0]);

export const titlesSummary = (list: readonly Tournament[], top: number): TitlesSummary => {
  const won = list.filter(hasWinners);
  const nations = new Map<string, number>();
  const counts = new Map<string, number>();
  const players = new Map<string, Player>();
  let titles = 0;
  for (const t of won)
    for (const c of t.champions) {
      titles++;
      for (const cc of new Set(c.players.map((p) => p.cc).filter(Boolean))) bump(nations, cc);
      for (const p of c.players) {
        if (!p.id) continue;
        bump(counts, p.id);
        if (!players.has(p.id)) players.set(p.id, p);
      }
    }
  const ranked = [...nations].sort(byCount).slice(0, top);
  const best = ranked[0]?.[1] ?? 1;
  const most = Math.max(0, ...counts.values());
  const leaders = [...counts]
    .filter(([, n]) => n === most)
    .flatMap(([id]) => players.get(id) ?? [])
    .sort((a, b) => compareText(a.name, b.name));
  return {
    events: won.length,
    titles,
    nations: ranked.map(([cc, n]) => ({ cc, titles: n, share: n / best })),
    leaders,
    most,
  };
};

export const raceTop = (rows: readonly RankRow[]) => {
  const found = rows.findIndex((r) => r.cutoff);
  const cut = found < 0 ? QUALIFY_SPOTS - 1 : found;
  return { rows: rows.slice(0, cut + 2), cut };
};
