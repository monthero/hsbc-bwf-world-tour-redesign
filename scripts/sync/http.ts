import { setTimeout as sleep } from 'node:timers/promises';
import { gunzipSync, gzipSync } from 'node:zlib';

import { exists, type Db } from './db.ts';

const BASE = 'https://extranet-lv.bwfbadminton.com/api/';
const USER_AGENT = 'Mozilla/5.0 (compatible; bwf-tracker-dev/0.1)';
const CONCURRENCY = 3;
const GAP_MS = 250;
const RETRIES = 8;
const THROTTLE_MS = 30_000;
const TIMEOUT_MS = 30_000;

export type Fresh = (fetchedAt: number) => boolean;

export const FOREVER: Fresh = () => true;
export const NEVER: Fresh = () => false;
export const within =
  (ms: number): Fresh =>
  (at) =>
    Date.now() - at < ms;

export const DAY_MS = 86_400_000;

const stats = { network: 0, cached: 0, failed: 0 };
export const httpStats = () => ({ ...stats });

let active = 0;
const waiting: (() => void)[] = [];

const acquire = () =>
  new Promise<void>((resolve) => {
    if (active < CONCURRENCY) {
      active++;
      resolve();
    } else waiting.push(resolve);
  });

const release = () => {
  const next = waiting.shift();
  if (next) next();
  else active--;
};

const RETRYABLE = new Set([403, 408, 425, 429, 500, 502, 503, 504]);

let pausedUntil = 0;

const throttle = (res: Response) => {
  const after = Number(res.headers.get('retry-after')) * 1000;
  pausedUntil = Math.max(pausedUntil, Date.now() + (after > 0 ? after : THROTTLE_MS));
};

const download = async (path: string, retries: number): Promise<string | null> => {
  for (let attempt = 0; ; attempt++) {
    await acquire();
    try {
      const wait = pausedUntil - Date.now();
      if (wait > 0) await sleep(wait);
      const res = await fetch(BASE + path, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const text = await res.text();
      if (res.ok && !text.trimStart().startsWith('<')) return text;
      if (res.status === 404) return null;
      if (res.status === 429) throttle(res);
      if (!RETRYABLE.has(res.status) || attempt >= retries) throw new Error(`${res.status} ${path}`);
    } catch (e) {
      if (attempt >= retries) throw e;
    } finally {
      await sleep(GAP_MS);
      release();
    }
    await sleep(Math.min(60_000, 1000 * 2 ** attempt));
  }
};

export interface Cached<T> {
  data: T;
  fetchedAt: number;
}

export const createClient = (db: Db, { offline = false } = {}) => {
  const read = db.prepare('SELECT fetched_at, body FROM responses WHERE path = ?');
  const write = db.prepare(
    'INSERT INTO responses (path, fetched_at, body) VALUES (?, ?, ?) ON CONFLICT(path) DO UPDATE SET fetched_at = excluded.fetched_at, body = excluded.body',
  );

  const cachedRow = (path: string) => read.get(path) as { fetched_at: number; body: Uint8Array } | undefined;

  const get = async <T>(path: string, fresh: Fresh, retries = RETRIES): Promise<Cached<T> | null> => {
    const row = cachedRow(path);
    if (row && (offline || fresh(row.fetched_at))) {
      stats.cached++;
      return { data: JSON.parse(gunzipSync(row.body).toString('utf8')) as T, fetchedAt: row.fetched_at };
    }
    if (offline) return null;
    try {
      const text = await download(path, retries);
      stats.network++;
      if (text === null) return null;
      const fetchedAt = Date.now();
      write.run(path, fetchedAt, gzipSync(text));
      return { data: JSON.parse(text) as T, fetchedAt };
    } catch (e) {
      stats.failed++;
      if (row) return { data: JSON.parse(gunzipSync(row.body).toString('utf8')) as T, fetchedAt: row.fetched_at };
      console.warn(`  ! ${(e as Error).message}`);
      return null;
    }
  };

  const has = (path: string) => exists(db, 'SELECT 1 FROM responses WHERE path = ?', path);

  const prune = (prefix: string, keep: string) =>
    db.prepare('DELETE FROM responses WHERE path LIKE ? AND path != ?').run(`${prefix}%`, keep);

  return { get, has, prune };
};

export type Client = ReturnType<typeof createClient>;

export const query = (path: string, params: Record<string, string | number | boolean>) =>
  `${path}?${new URLSearchParams(Object.entries(params).map(([k, v]): [string, string] => [k, String(v)])).toString()}`;

export const pool = async <T, R>(items: readonly T[], fn: (item: T, i: number) => Promise<R>): Promise<R[]> =>
  Promise.all(items.map((item, i) => fn(item, i)));
