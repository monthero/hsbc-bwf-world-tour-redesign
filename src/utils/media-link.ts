import type { MediaItem } from '../api/schemas.ts';
import { foldWords } from './fold.ts';

interface LinkPlayer {
  name: string;
  surname: string;
}

interface LinkTeam {
  players: readonly LinkPlayer[];
}

export interface LinkMatch {
  id: string;
  round: string;
  teams: readonly [LinkTeam, LinkTeam];
}

export interface MatchMedia {
  full?: MediaItem;
  highlights?: MediaItem;
  stream?: MediaItem;
}

export interface LinkedMedia<M extends LinkMatch> {
  byMatch: ReadonlyMap<string, MatchMedia>;
  matchOf: ReadonlyMap<string, M>;
}

const nameHit = (title: readonly string[], p: LinkPlayer) => {
  const own = foldWords(p.name);
  const surname = foldWords(p.surname);
  if (title.every((w) => own.includes(w))) return title.some((w) => surname.includes(w)) ? 2 : 1;
  const overlap = title.filter((w) => own.includes(w)).length;
  const extraGiven = surname.length > 0 && surname.every((w) => title.includes(w)) && overlap >= 2;
  return extraGiven && title.length - overlap <= 1 ? 1 : 0;
};

const teamHit = (names: readonly string[][], team: LinkTeam) => {
  const [a, b] = team.players;
  const [x, y] = names;
  if (names.length !== team.players.length || !a || !x) return 0;
  if (!b || !y) return nameHit(x, a);
  return Math.max(Math.min(nameHit(x, a), nameHit(y, b)), Math.min(nameHit(x, b), nameHit(y, a)));
};

const matchHit = (sides: readonly [string[][], string[][]], m: LinkMatch) => {
  const [s0, s1] = sides;
  const [t0, t1] = m.teams;
  return Math.max(Math.min(teamHit(s0, t0), teamHit(s1, t1)), Math.min(teamHit(s0, t1), teamHit(s1, t0)));
};

const bestMatch = <M extends LinkMatch>(item: MediaItem, matches: readonly M[]) => {
  if (!item.sides) return null;
  const sides: [string[][], string[][]] = [item.sides[0].map(foldWords), item.sides[1].map(foldWords)];
  let best = 0;
  let found: M[] = [];
  for (const m of matches) {
    const score = matchHit(sides, m);
    if (score > best) {
      best = score;
      found = [m];
    } else if (score === best && score > 0) found.push(m);
  }
  const narrowed = found.length > 1 && item.round ? found.filter((m) => m.round === item.round) : found;
  return narrowed.length === 1 ? (narrowed[0] ?? null) : null;
};

const SLOT: Partial<Record<MediaItem['kind'], keyof MatchMedia>> = { full_match: 'full', highlights: 'highlights' };

export const linkMedia = <M extends LinkMatch>(items: readonly MediaItem[], matches: readonly M[]): LinkedMedia<M> => {
  const byMatch = new Map<string, MatchMedia>();
  const matchOf = new Map<string, M>();
  for (const item of items) {
    const slot = item.live === 'none' ? SLOT[item.kind] : 'stream';
    const m = slot ? bestMatch(item, matches) : null;
    if (!slot || !m) continue;
    matchOf.set(item.id, m);
    const entry = byMatch.get(m.id) ?? {};
    entry[slot] ??= item;
    byMatch.set(m.id, entry);
  }
  return { byMatch, matchOf };
};
