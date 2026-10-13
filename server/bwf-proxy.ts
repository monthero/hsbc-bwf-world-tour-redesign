import { z } from 'zod'

import { addDays, todayIso } from '../scripts/sync/dates.ts'
import type { Endpoint } from './endpoints.ts'
import { cdnCache, sendJson } from './http.ts'

const BWF_API = 'https://extranet-lv.bwfbadminton.com/api'
const BWF_UA = 'Mozilla/5.0 (compatible; bwf-tracker-dev/0.1)'
const TIMEOUT_MS = 10_000
const SETTLE_DAYS = 3

const LIVE_CACHE = cdnCache(15, 15)
const SCHEDULE_CACHE = cdnCache(300, 600, 60)
const SETTLED_CACHE = cdnCache(86_400, 604_800, 3600)
const ERROR_CACHE = cdnCache(30, 0)

const Id = z.string().regex(/^\d{1,10}$/)
const Flag = z.enum(['0', '1', 'true', 'false'])
const TournamentCode = z.string().regex(/^[\dA-F]{8}(-[\dA-F]{4}){3}-[\dA-F]{12}$/i)
const IsoDay = z.iso.date()

const dayCache = (day: string) => {
  const today = todayIso()
  if (day < addDays(today, -SETTLE_DAYS)) return SETTLED_CACHE
  return day > addDays(today, 1) ? SCHEDULE_CACHE : LIVE_CACHE
}

interface Route {
  parse: (params: URLSearchParams) => { search: string; cache: string } | null
}

const route = <S extends z.ZodType<Record<string, string>>>(
  schema: S,
  cache: (query: z.infer<S>) => string,
): Route => ({
  parse: (params) => {
    const query = schema.safeParse(Object.fromEntries(params))
    return query.success ? { search: new URLSearchParams(query.data).toString(), cache: cache(query.data) } : null
  },
})

const ROUTES: Record<string, Route> = {
  '/tournaments/day-matches': route(
    z.strictObject({ tournamentCode: TournamentCode, date: IsoDay, order: Id, court: Id }),
    (q) => dayCache(q.date),
  ),
  '/match-center/vue-match-stat': route(z.strictObject({ tmtId: Id, matchId: Id }), () => LIVE_CACHE),
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
}

export const bwfProxy: Endpoint = {
  name: 'bwf-api',
  prefix: '/bwf-api',
  serve: async (url, res) => {
    const target = Object.hasOwn(ROUTES, url.pathname) ? ROUTES[url.pathname]?.parse(url.searchParams) : null
    if (!target) return sendJson(res, 404, { error: 'Unknown BWF route' }, ERROR_CACHE)
    const upstream = await fetch(`${BWF_API}${url.pathname}?${target.search}`, {
      headers: { 'user-agent': BWF_UA, accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    res.statusCode = upstream.status
    res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json')
    res.setHeader('cache-control', upstream.ok ? target.cache : ERROR_CACHE)
    res.end(Buffer.from(await upstream.arrayBuffer()))
  },
}
