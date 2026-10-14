import fs from 'node:fs';

import type { PlayerOverride } from '../../src/pages/admin/schema.ts';

export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export const collapseSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();

export const push = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

export const groupBy = <T, K>(xs: readonly T[], key: (x: T) => K) => {
  const out = new Map<K, T[]>();
  for (const x of xs) push(out, key(x), x);
  return out;
};

export const readJsonFile = <T>(file: string, fallback?: T): T =>
  fallback !== undefined && !fs.existsSync(file) ? fallback : (JSON.parse(fs.readFileSync(file, 'utf8')) as T);

export const prettyJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

export const readOverrides = (file: string) =>
  readJsonFile<{ players?: Record<string, PlayerOverride> }>(file, {}).players ?? {};
