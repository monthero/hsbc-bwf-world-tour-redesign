import type { z } from 'zod';

import { ApiError } from '../client';

const BASE = import.meta.env.VITE_BWF_API_BASE ?? '/bwf-api';
const TIMEOUT_MS = 15_000;
const BREAKER_LIMIT = 3;
const UNAVAILABLE = 503;

export const LIVE_COOLDOWN_MS = 5 * 60_000;

let failures = 0;
let openUntil = 0;

export const liveBlocked = () => Date.now() < openUntil;

const settle = (ok: boolean) => {
  failures = ok ? 0 : failures + 1;
  if (failures >= BREAKER_LIMIT) openUntil = Date.now() + LIVE_COOLDOWN_MS;
};

export const liveRetry = (count: number, error: unknown) =>
  count < 1 && !liveBlocked() && !(error instanceof ApiError && error.status < 500);

export const livePollMs = (ms: number) => (liveBlocked() ? LIVE_COOLDOWN_MS : ms);

const request = async (url: string, signal?: AbortSignal): Promise<unknown> => {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!res.ok) throw new ApiError(res.status, url);
    const body: unknown = await res.json();
    settle(true);
    return body;
  } catch (e) {
    if (!signal?.aborted) settle(false);
    throw e;
  }
};

export const bwfGet = async <S extends z.ZodType>(
  path: string,
  params: Record<string, string | number>,
  schema: S,
  signal?: AbortSignal,
): Promise<z.infer<S>> => {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${BASE}/${path}?${query}`;
  if (liveBlocked()) throw new ApiError(UNAVAILABLE, url);
  return schema.parse(await request(url, signal));
};
