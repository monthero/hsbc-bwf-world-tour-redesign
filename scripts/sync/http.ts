import { setTimeout as sleep } from 'node:timers/promises';
import { gzipSync } from 'node:zlib';

import { BWF_API, BWF_USER_AGENT } from '../../server/bwf-upstream.ts';
import { DAY_MS } from './dates.ts';
import { unzipJson, type Db } from './db.ts';

const CONCURRENCY = 3;
const GAP_MS = 250;
const RETRIES = 8;
const THROTTLE_MS = 30_000;
const TIMEOUT_MS = 30_000;
const FAILURE_TTL = DAY_MS;
const BROKEN = 500;
const REFUSED = 403;
const BLOCKED_AFTER = 25;

export type Fresh = (fetchedAt: number) => boolean;

export const FOREVER: Fresh = () => true;
export const within =
  (ms: number): Fresh =>
  (at) =>
    Date.now() - at < ms;

const stats = { network: 0, cached: 0, failed: 0, skipped: 0 };
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

class HttpError extends Error {
  status: number;

  constructor(status: number, path: string) {
    super(`${status} ${path}`);
    this.status = status;
  }
}

const RETRYABLE = new Set([403, 408, 425, 429, 500, 502, 503, 504]);

let pausedUntil = 0;
let refusals = 0;
let blocked = false;

const refused = () => {
  if (blocked || ++refusals < BLOCKED_AFTER) return;
  blocked = true;
  console.warn(`  ! BWF refused ${BLOCKED_AFTER} requests in a row, using stored data for the rest of this run`);
};

const throttle = (res: Response) => {
  const after = Number(res.headers.get('retry-after')) * 1000;
  pausedUntil = Math.max(pausedUntil, Date.now() + (after > 0 ? after : THROTTLE_MS));
};

const download = async (path: string, retries: number): Promise<string | null> => {
  for (let attempt = 0; ; attempt++) {
    if (blocked) throw new HttpError(REFUSED, path);
    await acquire();
    try {
      const wait = pausedUntil - Date.now();
      if (wait > 0) await sleep(wait);
      const res = await fetch(`${BWF_API}/${path}`, {
        headers: { 'User-Agent': BWF_USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const text = await res.text();
      if (res.ok && !text.trimStart().startsWith('<')) {
        refusals = 0;
        return text;
      }
      if (res.status === 404) return null;
      if (res.status === REFUSED) refused();
      if (res.status === 429) throttle(res);
      if (!RETRYABLE.has(res.status) || attempt >= retries) throw new HttpError(res.status, path);
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

  db.prepare('DELETE FROM failures WHERE failed_at < ?').run(Date.now() - FAILURE_TTL);
  const readFailure = db.prepare('SELECT failed_at FROM failures WHERE path = ?');
  const writeFailure = db.prepare(
    'INSERT INTO failures (path, failed_at) VALUES (?, ?) ON CONFLICT(path) DO UPDATE SET failed_at = excluded.failed_at',
  );
  const clearFailure = db.prepare('DELETE FROM failures WHERE path = ?');

  const failedAt = (path: string) => (readFailure.get(path) as { failed_at: number } | undefined)?.failed_at;

  const cachedRow = (path: string) => read.get(path) as { fetched_at: number; body: Uint8Array } | undefined;

  const fromRow = <T>(row: { fetched_at: number; body: Uint8Array }): Cached<T> => ({
    data: unzipJson(row.body) as T,
    fetchedAt: row.fetched_at,
  });

  const get = async <T>(path: string, fresh: Fresh, retries = RETRIES): Promise<Cached<T> | null> => {
    const row = cachedRow(path);
    if (row && (offline || fresh(row.fetched_at))) {
      stats.cached++;
      return fromRow<T>(row);
    }
    if (offline) return null;
    const failed = failedAt(path);
    if (failed && Date.now() - failed < FAILURE_TTL && fresh(failed)) {
      stats.skipped++;
      return row ? fromRow<T>(row) : null;
    }
    try {
      const text = await download(path, retries);
      stats.network++;
      if (failed) clearFailure.run(path);
      if (text === null) return null;
      const fetchedAt = Date.now();
      write.run(path, fetchedAt, gzipSync(text));
      return { data: JSON.parse(text) as T, fetchedAt };
    } catch (e) {
      stats.failed++;
      if (e instanceof HttpError && e.status === BROKEN) writeFailure.run(path, Date.now());
      if (row) return fromRow<T>(row);
      if (!blocked) console.warn(`  ! ${(e as Error).message}`);
      return null;
    }
  };

  const pruneRange = db.prepare('DELETE FROM responses WHERE path >= ? AND path < ? AND path != ?');
  const prune = (prefix: string, keep: string) => pruneRange.run(prefix, `${prefix}\uffff`, keep);

  return { get, prune };
};

export type Client = ReturnType<typeof createClient>;

export const query = (path: string, params: Record<string, string | number | boolean>) =>
  `${path}?${new URLSearchParams(Object.entries(params).map(([k, v]): [string, string] => [k, String(v)])).toString()}`;

export const pool = async <T, R>(items: readonly T[], fn: (item: T, i: number) => Promise<R>): Promise<R[]> =>
  Promise.all(items.map((item, i) => fn(item, i)));
