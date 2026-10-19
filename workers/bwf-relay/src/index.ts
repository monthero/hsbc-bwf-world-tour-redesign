import { type BwfReply, bwfTarget, type CachePolicy, fetchBwf, UNKNOWN_ROUTE } from '../../../server/bwf-upstream.ts';
import { isRelayHost, RELAY_FETCH_PATH, RELAY_TOKEN_HEADER } from '../../../src/api/bwf/relay.ts';

interface Env {
  SYNC_TOKEN?: string;
}

const ALLOWED_ORIGIN = /^(https:\/\/hsbc-bwf-world-tour-redesign(-[\da-z-]+)?\.vercel\.app|http:\/\/localhost(:\d+)?)$/;
const ALLOWED_METHODS = 'GET, OPTIONS';
const CACHE_HEADER = 'x-relay-cache';
const FORWARDED_HEADERS = ['user-agent', 'accept', 'referer'];
const PASSED_HEADERS = ['content-type', 'retry-after'];

const corsHeaders = (origin: string | null) => {
  const headers = new Headers({ vary: 'Origin' });
  if (origin && ALLOWED_ORIGIN.test(origin)) headers.set('access-control-allow-origin', origin);
  return headers;
};

const jsonResponse = ({ status, body, cache }: BwfReply) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache.edge },
  });

const withCors = (response: Response, origin: string | null, extra: Record<string, string> = {}) => {
  const out = new Response(response.body, response);
  for (const [key, value] of [...corsHeaders(origin), ...Object.entries(extra)]) out.headers.set(key, value);
  return out;
};

const browserCache = (response: Response, policy: CachePolicy): Record<string, string> =>
  response.ok ? { 'cache-control': policy.browser } : {};

const preflight = (origin: string | null) => {
  const headers = corsHeaders(origin);
  headers.set('access-control-allow-methods', ALLOWED_METHODS);
  headers.set('access-control-allow-headers', 'accept');
  headers.set('access-control-max-age', '86400');
  return new Response(null, { status: 204, headers });
};

const pick = (from: Headers, names: readonly string[]) => {
  const out = new Headers();
  for (const name of names) {
    const value = from.get(name);
    if (value) out.set(name, value);
  }
  return out;
};

const syncTarget = (url: URL) => {
  const raw = url.searchParams.get('url');
  const target = raw && URL.canParse(raw) ? new URL(raw) : null;
  return target && isRelayHost(target) ? target : null;
};

const syncFetch = async (request: Request, url: URL, token: string | undefined) => {
  if (!token || request.headers.get(RELAY_TOKEN_HEADER) !== token) return new Response(null, { status: 403 });
  const target = syncTarget(url);
  if (!target) return new Response(null, { status: 400 });
  const upstream = await fetch(target, { headers: pick(request.headers, FORWARDED_HEADERS), redirect: 'follow' });
  return new Response(upstream.body, { status: upstream.status, headers: pick(upstream.headers, PASSED_HEADERS) });
};

export default {
  fetch: async (request, env, ctx) => {
    const origin = request.headers.get('origin');
    if (request.method === 'OPTIONS') return preflight(origin);
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { allow: ALLOWED_METHODS } });
    const url = new URL(request.url);
    if (url.pathname === RELAY_FETCH_PATH) return syncFetch(request, url, env.SYNC_TOKEN);
    const target = bwfTarget(url);
    if (!target) return withCors(jsonResponse(UNKNOWN_ROUTE), origin);
    const key = new Request(`${url.origin}${target.path}?${target.search}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return withCors(hit, origin, { [CACHE_HEADER]: 'HIT', ...browserCache(hit, target.cache) });
    const response = jsonResponse(await fetchBwf(target));
    ctx.waitUntil(cache.put(key, response.clone()));
    return withCors(response, origin, { [CACHE_HEADER]: 'MISS', ...browserCache(response, target.cache) });
  },
} satisfies ExportedHandler<Env>;
