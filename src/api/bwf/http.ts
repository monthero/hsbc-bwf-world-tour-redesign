import type { z } from 'zod';

import { BWF_RELAY_URL } from '~/constants';

import { ApiError } from '../client';

const BASE = import.meta.env.VITE_BWF_API_BASE || (import.meta.env.PROD ? BWF_RELAY_URL : '/bwf-api');
const TIMEOUT_MS = 15_000;
const BREAKER_LIMIT = 3;
const UNAVAILABLE = 503;
const OVER_QUOTA = 429;

export const LIVE_COOLDOWN_MS = 5 * 60_000;

let failures = 0;
let openUntil = 0;
let reopen: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export const livePaused = () => Date.now() < openUntil;

export const subscribeLivePaused = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const trip = () => {
  openUntil = Date.now() + LIVE_COOLDOWN_MS;
  clearTimeout(reopen);
  reopen = setTimeout(emit, LIVE_COOLDOWN_MS);
  emit();
};

const settle = (ok: boolean) => {
  failures = ok ? 0 : failures + 1;
  if (failures >= BREAKER_LIMIT) trip();
};

const overQuota = (error: unknown) => error instanceof ApiError && error.status === OVER_QUOTA;

export const isRejected = (error: unknown) => error instanceof ApiError && error.status < 500 && !overQuota(error);

export const liveRetry = (count: number, error: unknown) => count < 1 && !livePaused() && !isRejected(error);

export const livePollMs = (ms: number) => (livePaused() ? LIVE_COOLDOWN_MS : ms);

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
    if (overQuota(e)) {
      failures = BREAKER_LIMIT;
      trip();
    } else if (!signal?.aborted && !isRejected(e)) settle(false);
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
  if (livePaused()) throw new ApiError(UNAVAILABLE, url);
  return schema.parse(await request(url, signal));
};
