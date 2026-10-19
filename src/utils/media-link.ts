import type { MediaItem } from '../api/schemas.ts';
import { foldWords } from './fold.ts';

interface LinkPlayer {
  id: string;
  name: string;
  surname: string;
}

interface LinkTeam {
  players: readonly LinkPlayer[];
}

export interface LinkMatch {
  id: string;
  code: string | null;
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

const byRound = <M extends LinkMatch>(found: readonly M[], round: string | null) => {
  const narrowed = found.length > 1 && round ? found.filter((m) => m.round === round) : found;
  return narrowed.length === 1 ? (narrowed[0] ?? null) : null;
};

const nameMatch = <M extends LinkMatch>(item: MediaItem, matches: readonly M[]) => {
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
  return byRound(found, item.round);
};

interface Indexed<M extends LinkMatch> {
  match: M;
  ids: ReadonlySet<string>;
}

interface IdIndex<M extends LinkMatch> {
  byCode: ReadonlyMap<string, Indexed<M>>;
  byPlayer: ReadonlyMap<string, readonly Indexed<M>[]>;
}

const indexMatches = <M extends LinkMatch>(matches: readonly M[]): IdIndex<M> => {
  const byCode = new Map<string, Indexed<M>>();
  const byPlayer = new Map<string, Indexed<M>[]>();
  for (const match of matches) {
    const entry = { match, ids: new Set(match.teams.flatMap((t) => t.players.map((p) => p.id))) };
    if (match.code) byCode.set(match.code, entry);
    for (const id of entry.ids) {
      const list = byPlayer.get(id);
      if (list) list.push(entry);
      else byPlayer.set(id, [entry]);
    }
  }
  return { byCode, byPlayer };
};

const idMatch = <M extends LinkMatch>(item: MediaItem, index: IdIndex<M>) => {
  const { players } = item;
  const covers = (e: Indexed<M>) => players.every((p) => e.ids.has(p));
  const tagged = item.match ? index.byCode.get(item.match) : undefined;
  if (tagged && covers(tagged)) return tagged.match;
  const [first] = players;
  if (!first) return null;
  const found = index.byPlayer.get(first)?.filter(covers) ?? [];
  const exact = found.filter((e) => e.ids.size === players.length);
  return byRound(
    (exact.length ? exact : found).map((e) => e.match),
    item.round,
  );
};

const bestMatch = <M extends LinkMatch>(item: MediaItem, matches: readonly M[], index: IdIndex<M>) =>
  idMatch(item, index) ?? nameMatch(item, matches);

const SLOT: Partial<Record<MediaItem['kind'], keyof MatchMedia>> = { full_match: 'full', highlights: 'highlights' };

export const linkMedia = <M extends LinkMatch>(items: readonly MediaItem[], matches: readonly M[]): LinkedMedia<M> => {
  const byMatch = new Map<string, MatchMedia>();
  const matchOf = new Map<string, M>();
  const index = indexMatches(matches);
  for (const item of items) {
    const slot = item.live === 'none' ? SLOT[item.kind] : 'stream';
    const m = slot ? bestMatch(item, matches, index) : null;
    if (!slot || !m) continue;
    matchOf.set(item.id, m);
    const entry = byMatch.get(m.id) ?? {};
    entry[slot] ??= item;
    byMatch.set(m.id, entry);
  }
  return { byMatch, matchOf };
};
