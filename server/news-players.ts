import type { NewsBlock, NewsRun } from '../src/api/schemas.ts';

export interface PlayerName {
  id: string;
  names: string[];
}

const COMMON = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'be',
  'by',
  'do',
  'go',
  'he',
  'if',
  'in',
  'is',
  'it',
  'me',
  'my',
  'no',
  'of',
  'oh',
  'on',
  'or',
  'so',
  'the',
  'to',
  'up',
  'us',
  'we',
  'will',
  'may',
  'can',
  'see',
  'man',
  'won',
  'long',
  'young',
  'king',
  'mark',
  'rose',
  'hope',
  'joy',
  'grace',
  'june',
  'april',
  'august',
  'new',
  'open',
  'best',
  'win',
  'top',
]);

const MIN_TOKENS = 2;
const SPLIT = /[\s.\-‐–]+/;

const foldChar = (c: string) => c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().charAt(0) || c;

const foldText = (s: string) => {
  let out = '';
  for (let i = 0; i < s.length; i++) out += foldChar(s.charAt(i));
  return out;
};

const tokensOf = (name: string) =>
  foldText(name)
    .replace(/[^\p{L}\p{N}\s.\-‐–]/gu, ' ')
    .split(SPLIT)
    .filter(Boolean);

const ordersOf = (tokens: string[]) => {
  const [first = '', ...rest] = tokens;
  const init = tokens.slice(0, -1);
  const last = tokens.at(-1) ?? '';
  return [tokens, [...rest, first], [last, ...init]].map((t) => t.join(' '));
};

const WORD = /[\p{L}\p{N}]+/gu;
const GAP = /^[\s.\-‐–]{1,3}$/;

interface Variant {
  tokens: string[];
  id: string;
}

export interface PlayerMatcher {
  find: (text: string) => { start: number; end: number; id: string }[];
}

const build = (candidates: PlayerName[]): PlayerMatcher => {
  const owners = new Map<string, Set<string>>();
  for (const c of candidates)
    for (const name of c.names) {
      const tokens = tokensOf(name);
      if (tokens.length < MIN_TOKENS) continue;
      if (tokens.length === MIN_TOKENS && tokens.some((t) => COMMON.has(t) || t.length < 2)) continue;
      for (const key of ordersOf(tokens)) owners.set(key, (owners.get(key) ?? new Set()).add(c.id));
    }
  const byFirst = new Map<string, Variant[]>();
  for (const [key, ids] of owners) {
    const [id] = ids;
    if (ids.size !== 1 || !id) continue;
    const tokens = key.split(' ');
    const first = tokens[0] ?? '';
    byFirst.set(first, [...(byFirst.get(first) ?? []), { tokens, id }]);
  }
  for (const list of byFirst.values()) list.sort((a, b) => b.tokens.length - a.tokens.length);
  return {
    find: (text) => {
      const folded = foldText(text);
      const words = [...folded.matchAll(WORD)].map((m) => ({ w: m[0], start: m.index, end: m.index + m[0].length }));
      const out: { start: number; end: number; id: string }[] = [];
      for (let i = 0; i < words.length; i++) {
        const hit = byFirst.get(words[i]?.w ?? '')?.find((v) =>
          v.tokens.every((t, k) => {
            const word = words[i + k];
            const prev = words[i + k - 1];
            return word?.w === t && (k === 0 || (!!prev && GAP.test(folded.slice(prev.end, word.start))));
          }),
        );
        const first = words[i];
        const last = hit ? words[i + hit.tokens.length - 1] : undefined;
        if (!hit || !first || !last) continue;
        out.push({ start: first.start, end: last.end, id: hit.id });
        i += hit.tokens.length - 1;
      }
      return out;
    },
  };
};

const cache = new WeakMap<PlayerName[], PlayerMatcher>();

export const playerMatcher = (candidates: PlayerName[]) => {
  const hit = cache.get(candidates);
  if (hit) return hit;
  const made = build(candidates);
  cache.set(candidates, made);
  return made;
};

export const linkMatchedPlayers = (blocks: NewsBlock[], matcher: PlayerMatcher, known: ReadonlySet<string>) => {
  const linked = new Set<string>();
  const split = (runs: NewsRun[]) =>
    runs.flatMap((r): NewsRun[] => {
      if (r.link) return [r];
      const out: NewsRun[] = [];
      let at = 0;
      for (const m of matcher.find(r.text)) {
        if (known.has(m.id) || linked.has(m.id) || m.start < at) continue;
        linked.add(m.id);
        if (m.start > at) out.push({ ...r, text: r.text.slice(at, m.start) });
        out.push({ ...r, text: r.text.slice(m.start, m.end), link: { kind: 'player', id: m.id } });
        at = m.end;
      }
      if (!out.length) return [r];
      if (at < r.text.length) out.push({ ...r, text: r.text.slice(at) });
      return out;
    });
  const next = blocks.map((b): NewsBlock => {
    if (b.type === 'paragraph' || b.type === 'quote') return { ...b, runs: split(b.runs) };
    if (b.type === 'list') return { ...b, items: b.items.map(split) };
    return b;
  });
  return { blocks: next, matched: [...linked] };
};
