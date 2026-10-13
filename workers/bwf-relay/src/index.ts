import { type BwfReply, bwfTarget, fetchBwf, UNKNOWN_ROUTE } from '../../../server/bwf-upstream.ts';

const ALLOWED_ORIGIN = /^(https:\/\/hsbc-bwf-world-tour-redesign(-[\da-z-]+)?\.vercel\.app|http:\/\/localhost(:\d+)?)$/;
const ALLOWED_METHODS = 'GET, OPTIONS';
const CACHE_HEADER = 'x-relay-cache';

const corsHeaders = (origin: string | null) => {
  const headers = new Headers({ vary: 'Origin' });
  if (origin && ALLOWED_ORIGIN.test(origin)) headers.set('access-control-allow-origin', origin);
  return headers;
};

const jsonResponse = ({ status, body, cache }: BwfReply) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  });

const withCors = (response: Response, origin: string | null, extra: Record<string, string> = {}) => {
  const out = new Response(response.body, response);
  for (const [key, value] of [...corsHeaders(origin), ...Object.entries(extra)]) out.headers.set(key, value);
  return out;
};

const preflight = (origin: string | null) => {
  const headers = corsHeaders(origin);
  headers.set('access-control-allow-methods', ALLOWED_METHODS);
  headers.set('access-control-allow-headers', 'accept');
  headers.set('access-control-max-age', '86400');
  return new Response(null, { status: 204, headers });
};

export default {
  fetch: async (request, _env, ctx) => {
    const origin = request.headers.get('origin');
    if (request.method === 'OPTIONS') return preflight(origin);
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { allow: ALLOWED_METHODS } });
    const url = new URL(request.url);
    const target = bwfTarget(url);
    if (!target) return withCors(jsonResponse(UNKNOWN_ROUTE), origin);
    const key = new Request(`${url.origin}${target.path}?${target.search}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return withCors(hit, origin, { [CACHE_HEADER]: 'HIT' });
    const response = jsonResponse(await fetchBwf(target));
    ctx.waitUntil(cache.put(key, response.clone()));
    return withCors(response, origin, { [CACHE_HEADER]: 'MISS' });
  },
} satisfies ExportedHandler;
