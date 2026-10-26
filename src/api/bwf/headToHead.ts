import type { Game } from '~/types';
import type { OtherMeet } from '~/utils/h2h';

import { bwfGet } from './http';
import { toOtherMeets } from './normalize';
import { BwfHeadToHead } from './schemas';

const byId = (x: string, y: string) => Number(x) - Number(y);

const sideParams = (side: 1 | 2, ids: readonly string[]) =>
  Object.fromEntries(ids.map((id, i) => [`t${side}p${i + 1}`, id]));

export const headToHeadPair = (a: readonly string[], b: readonly string[]) => {
  const x = a.toSorted(byId);
  const y = b.toSorted(byId);
  const flipped = byId(x[0] ?? '', y[0] ?? '') > 0;
  return { first: flipped ? y : x, second: flipped ? x : y, flipped };
};

export const flipMeets = (list: readonly OtherMeet[]): OtherMeet[] =>
  list.map((m) => ({ ...m, won: !m.won, games: m.games.map(([x, y]): Game => [y, x]) }));

export const fetchHeadToHead = async (a: readonly string[], b: readonly string[], signal?: AbortSignal) =>
  toOtherMeets(await bwfGet('h2h/statistics', { ...sideParams(1, a), ...sideParams(2, b) }, BwfHeadToHead, signal), a);
