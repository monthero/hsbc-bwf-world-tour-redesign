import { z } from 'zod';

import { addDays, todayIso } from '../scripts/sync/dates.ts';
import { LIVE_BROWSER_TTL_S, LIVE_TTL_S, SCHEDULE_TTL_S } from '../src/api/bwf/ttl.ts';
import { browserCache, cdnCache } from './cache-control.ts';

export const BWF_API = 'https://extranet-lv.bwfbadminton.com/api';
export const BWF_SITE = 'https://bwfworldtour.bwfbadminton.com';
export const BWF_USER_AGENT = 'Mozilla/5.0 (compatible; bwf-tracker-dev/0.1)';

const BWF_HEADERS = {
  'user-agent': BWF_USER_AGENT,
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  origin: BWF_SITE,
  referer: `${BWF_SITE}/`,
};

const TIMEOUT_MS = 10_000;
const SETTLE_DAYS = 3;

export interface CachePolicy {
  edge: string;
  browser: string;
}

const shared = (header: string): CachePolicy => ({ edge: header, browser: header });

const LIVE_CACHE: CachePolicy = {
  edge: cdnCache(LIVE_TTL_S, LIVE_TTL_S),
  browser: browserCache(LIVE_BROWSER_TTL_S),
};
const SCHEDULE_CACHE = shared(cdnCache(SCHEDULE_TTL_S, 600, 60));
const SETTLED_CACHE = shared(cdnCache(86_400, 604_800, 3600));
const ERROR_CACHE = shared(cdnCache(30, 0));

const Id = z.string().regex(/^\d{1,10}$/);
const Flag = z.enum(['0', '1', 'true', 'false']);
const TournamentCode = z.string().regex(/^[\dA-F]{8}(-[\dA-F]{4}){3}-[\dA-F]{12}$/i);
const IsoDay = z.iso.date();

const dayCache = (day: string) => {
  const today = todayIso();
  if (day < addDays(today, -SETTLE_DAYS)) return SETTLED_CACHE;
  return day > addDays(today, 1) ? SCHEDULE_CACHE : LIVE_CACHE;
};

interface BwfTarget {
  path: string;
  search: string;
  cache: CachePolicy;
}

export interface BwfReply {
  status: number;
  body: unknown;
  cache: CachePolicy;
}

type Route = (path: string, params: URLSearchParams) => BwfTarget | null;

const route =
  <S extends z.ZodType<Record<string, string>>>(schema: S, cache: (query: z.infer<S>) => CachePolicy): Route =>
  (path, params) => {
    const query = schema.safeParse(Object.fromEntries(params));
    return query.success
      ? { path, search: new URLSearchParams(query.data).toString(), cache: cache(query.data) }
      : null;
  };

const ROUTES: Record<string, Route> = {
  '/tournaments/day-matches': route(
    z.strictObject({ tournamentCode: TournamentCode, date: IsoDay, order: Id, court: Id }),
    (q) => dayCache(q.date),
  ),
  '/match-center/vue-match-stat': route(z.strictObject({ tmtId: Id, matchId: Id }), () => LIVE_CACHE),
  '/match-center/vue-game-stat': route(z.strictObject({ tmtId: Id, matchId: Id, gameId: Id }), () => LIVE_CACHE),
  '/match-center/vue-live-matches': route(z.strictObject({ tmtId: Id }), () => LIVE_CACHE),
  '/match-center/vue-live-single': route(z.strictObject({ tmtId: Id, matchId: Id }), () => LIVE_CACHE),
  '/vue-tournament-draws': route(z.strictObject({ tmtTab: z.literal('draw'), tmtId: Id }), () => SCHEDULE_CACHE),
  '/vue-tournament-draw-data': route(
    z.strictObject({ tmtTab: z.literal('draw'), tmtId: Id, drawId: Id, isPara: Flag }),
    () => SCHEDULE_CACHE,
  ),
  '/entries/vue-tournament-events': route(z.strictObject({ tmtId: Id }), () => SCHEDULE_CACHE),
  '/entries/vue-tournament-players': route(
    z.strictObject({ searchKey: z.literal(''), tmtId: Id, tmtType: Id, eventName: Id, isPara: Flag }),
    () => SCHEDULE_CACHE,
  ),
};

const failure = (status: number, error: string): BwfReply => ({ status, body: { error }, cache: ERROR_CACHE });

export const UNKNOWN_ROUTE = failure(404, 'Unknown BWF route');

export const bwfTarget = ({ pathname, searchParams }: URL) =>
  Object.hasOwn(ROUTES, pathname) ? ROUTES[pathname](pathname, searchParams) : null;

export const fetchBwf = async ({ path, search, cache }: BwfTarget): Promise<BwfReply> => {
  const upstream = await fetch(`${BWF_API}${path}?${search}`, {
    headers: BWF_HEADERS,
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
  if (!upstream) return failure(504, 'upstream unavailable');
  const body: unknown = await upstream.json().catch(() => undefined);
  if (body === undefined) return failure(502, 'upstream blocked');
  return { status: upstream.status, body, cache: upstream.ok ? cache : ERROR_CACHE };
};

export const bwfReply = (url: URL) => {
  const target = bwfTarget(url);
  return target ? fetchBwf(target) : UNKNOWN_ROUTE;
};
