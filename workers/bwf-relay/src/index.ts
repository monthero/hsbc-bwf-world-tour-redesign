import { BWF_API, BWF_HEADERS, isBwfPath, RELAY_KEY_HEADER } from '../../../server/bwf-upstream.ts';

interface Env {
  RELAY_KEY?: string;
}

const TIMEOUT_MS = 10_000;
const encoder = new TextEncoder();

const digest = (value: string) => crypto.subtle.digest('SHA-256', encoder.encode(value));

const authorized = async (given: string | null, expected: string | undefined) => {
  if (!given || !expected) return false;
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  return crypto.subtle.timingSafeEqual(a, b);
};

const empty = (status: number, headers?: HeadersInit) => new Response(null, { status, headers });

export default {
  fetch: async (request, env) => {
    if (request.method !== 'GET') return empty(405, { allow: 'GET' });
    if (!(await authorized(request.headers.get(RELAY_KEY_HEADER), env.RELAY_KEY))) return empty(401);
    const { pathname, search } = new URL(request.url);
    if (!isBwfPath(pathname)) return empty(404);
    const upstream = await fetch(`${BWF_API}${pathname}${search}`, {
      headers: BWF_HEADERS,
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => null);
    if (!upstream) return empty(504);
    const type = upstream.headers.get('content-type');
    return new Response(upstream.body, { status: upstream.status, headers: type ? { 'content-type': type } : {} });
  },
} satisfies ExportedHandler<Env>;
