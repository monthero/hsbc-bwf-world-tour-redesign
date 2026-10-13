import fs from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

import { dayjs, nowIso } from '../scripts/sync/dates.ts'
import type {
  NewsArticle,
  NewsImage,
  NewsIndex,
  NewsItem,
  NewsMonth,
  NewsMonthCount,
  NewsSite,
  NewsTournament,
} from '../src/api/schemas.ts'
import { readJson } from './http.ts'
import { createArticleBuilder } from './news-blocks.ts'
import type { PlayerName } from './news-players.ts'

const CMS = 'https://cms.bwfbadminton.com/wp-json'
const LIST = `${CMS}/newsapi/v1/category/world-tour`
const WT = 'https://bwfworldtour.bwfbadminton.com'
const USER_AGENT = 'Mozilla/5.0 (compatible; bwf-tracker-dev/0.1)'
const RETRIES = 3
const TIMEOUT_MS = 30_000
const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const EXCERPT_MAX = 220
const EXCERPT_MIN = 40

export const NEWS_FREEZE_MS = 30 * DAY_MS
export const NEWS_LATEST = 12
export const NEWS_POPULAR = 5

const SITES: Record<string, NewsSite> = { 'World Tour': 'world-tour', 'World Tour Finals': 'world-tour-finals' }

export interface RawNews {
  id: number
  date: string
  dateutc: string
  modifiedutc: string
  title: string
  link: string
  image: { full: string | null; caption: string | null } | null
  author: string[]
  destination: string
  category: { name: string; slug: string }[] | null
  tag: { name: string; slug: string }[] | null
  featured: boolean
  content: string
}

export interface RawNewsPage {
  results: { total_posts: number; total_pages: number; page: number; per_page: number }
  data: RawNews[]
}

export interface NewsEvent {
  code: string
  tmtId: number | null
  series: string
  start: string
}

export interface NewsSeries {
  id: string
  match: string
}

export interface NewsRequest {
  timeoutMs?: number
  retries?: number
}

const CHALLENGE = /challenge-platform|cf-chl|Just a moment/

const failure = (res: Response, body: string) => {
  const blocked = res.headers.has('cf-mitigated') || CHALLENGE.test(body)
  return `HTTP ${res.status}${blocked ? ' (Cloudflare challenge, this IP is blocked)' : ''}`
}

const reasonOf = (e: unknown, timeoutMs: number) =>
  e instanceof Error && e.name === 'TimeoutError' ? `timed out after ${timeoutMs / 1000} s` : String(e)

const request = async (
  url: string,
  accept: string,
  { timeoutMs = TIMEOUT_MS, retries = RETRIES }: NewsRequest = {},
) => {
  for (let attempt = 0; ; attempt++) {
    let reason: string
    let retryable = true
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: accept },
        signal: AbortSignal.timeout(timeoutMs),
      })
      const text = await res.text()
      if (res.ok) return text
      reason = failure(res, text)
      retryable = res.status >= 500 || res.status === 403 || res.status === 429
    } catch (e) {
      reason = reasonOf(e, timeoutMs)
    }
    if (!retryable || attempt >= retries)
      throw new Error(`${url}: ${reason} after ${attempt + 1} ${attempt ? 'tries' : 'try'}`)
    await sleep(1000 * 2 ** attempt + Math.random() * 500)
  }
}

export const fetchNewsPage = async (page: number, perPage: number, opts?: NewsRequest) =>
  JSON.parse(await request(`${LIST}?per_page=${perPage}&page=${page}`, 'application/json', opts)) as RawNewsPage

export const fetchNewsBySlug = async (slug: string, opts?: NewsRequest) => {
  const hits = JSON.parse(
    await request(`${CMS}/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id`, 'application/json', opts),
  ) as { id: number }[]
  const id = hits[0]?.id
  return id ? fetchNewsPost(id, opts) : null
}

export const fetchNewsPost = async (id: number, opts?: NewsRequest) => {
  const posts = JSON.parse(await request(`${CMS}/newsapi/v1/post/${id}`, 'application/json', opts)) as RawNews[]
  return posts[0] ?? null
}

const SIDEBAR = /widget__latest-news([\s\S]*?)<\/aside>/
const SINGLE = /news-single\/\d{4}\/\d{2}\/\d{2}\/([^/"]+)/g

export const fetchPopularSlugs = async (opts?: NewsRequest) => {
  const html = await request(`${WT}/news/`, 'text/html', opts)
  const side = html.match(SIDEBAR)?.[1]
  if (side === undefined)
    throw new Error(
      `${WT}/news/ has no popular sidebar (${html.length} bytes${CHALLENGE.test(html) ? ', a Cloudflare challenge page' : ''})`,
    )
  const slugs = [...new Set([...side.matchAll(SINGLE)].map((m) => decodeURIComponent(m[1] ?? '')))]
    .filter(Boolean)
    .slice(0, NEWS_POPULAR)
  if (!slugs.length) throw new Error(`${WT}/news/ popular sidebar has no article links`)
  return slugs
}

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, n: string) => ENTITIES[n] ?? '')

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

const uniq = <T>(xs: T[]) => [...new Set(xs)]

const groupBy = <T>(xs: T[], key: (x: T) => string) => {
  const out = new Map<string, T[]>()
  for (const x of xs) out.set(key(x), [...(out.get(key(x)) ?? []), x])
  return out
}

const utcOf = (s: string) => dayjs.utc(s)

export const publishedMs = (raw: RawNews) => utcOf(raw.dateutc).valueOf()

export const newsMonthOf = (item: Pick<NewsItem, 'publishedAt'>) => item.publishedAt.slice(0, 7)

const slugOf = (link: string) => decodeURIComponent(link.split('/').filter(Boolean).at(-1) ?? '')

const CLOUDINARY = /\/v(\d+)\/(.+)\/[^/]+?\.(\w+)$/

const imageOf = (raw: RawNews): NewsImage | null => {
  const m = raw.image?.full?.match(CLOUDINARY)
  if (!m?.[1] || !m[2] || !m[3]) return null
  const caption = raw.image?.caption ? decode(raw.image.caption).trim() : ''
  return { id: m[2], v: Number(m[1]), ext: m[3], caption: caption || null }
}

const excerptOf = (content: string) => {
  const text = decode(
    content
      .replace(/\[caption[\s\S]*?\[\/caption\]/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/\S+/g, ''),
  )
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((s) => s.length > EXCERPT_MIN)
  if (!text) return null
  return text.length > EXCERPT_MAX ? `${text.slice(0, EXCERPT_MAX - 3).replace(/\s+\S*$/, '')}…` : text
}

const TOURNAMENT_LINK = /\/tournament\/(\d+)\//g
const PLAYER_LINK = /\/player\/(\d+)\//g

export const createNewsLinker = (events: NewsEvent[], series: NewsSeries[]) => {
  const byTmt = new Map(events.filter((e) => e.tmtId).map((e) => [e.tmtId, e]))
  const res = series.map((s) => ({ id: s.id, re: new RegExp(s.match, 'i') }))
  const bySeriesYear = groupBy(events, (e) => `${e.series}|${e.start.slice(0, 4)}`)

  const prefixSeries = (title: string) => {
    const i = title.indexOf(': ')
    if (i <= 0) return null
    const prefix = fold(title.slice(0, i))
    const hits = res.filter((s) => s.re.test(prefix))
    return hits.length === 1 ? (hits[0]?.id ?? null) : null
  }

  return (raw: RawNews): NewsItem | null => {
    const site = SITES[raw.destination]
    if (!site || !raw.link) return null
    const title = decode(raw.title).trim()
    const publishedAt = utcOf(raw.dateutc).toISOString()
    const linked = uniq([...raw.content.matchAll(TOURNAMENT_LINK)].map((m) => byTmt.get(Number(m[1]))))
      .filter((e) => e !== undefined)
      .map((e) => ({ code: e.code, series: e.series }))
    const prefixed = prefixSeries(title)
    const sameYear = prefixed ? (bySeriesYear.get(`${prefixed}|${publishedAt.slice(0, 4)}`) ?? []) : []
    const fallback = !linked.length && sameYear.length === 1 ? sameYear : []
    const tournaments = linked.length ? linked : fallback
    const linkedSeries = uniq(tournaments.map((t) => t.series))
    const slug = slugOf(raw.link)
    return {
      id: String(raw.id),
      slug,
      title,
      publishedAt,
      url: `${WT}/news-single/${raw.date.slice(0, 10).replaceAll('-', '/')}/${encodeURIComponent(slug)}/`,
      site,
      feature: raw.category?.some((c) => c.slug === 'feature-stories') ?? false,
      image: imageOf(raw),
      excerpt: excerptOf(raw.content),
      series: prefixed ?? (linkedSeries.length === 1 ? (linkedSeries[0] ?? null) : null),
      tournaments: tournaments.map((t) => t.code),
      players: uniq([...raw.content.matchAll(PLAYER_LINK)].map((m) => m[1] ?? '')).filter(Boolean),
    }
  }
}

export const byNewest = (a: NewsItem, b: NewsItem) =>
  b.publishedAt.localeCompare(a.publishedAt) || Number(b.id) - Number(a.id)

export const monthCounts = (items: NewsItem[]): NewsMonthCount[] =>
  [...groupBy(items, newsMonthOf)]
    .map(([month, xs]) => ({ month, count: xs.length }))
    .sort((a, b) => b.month.localeCompare(a.month))

const LIVE_PAGE = 30
const RANKED_TOP = 200

interface DirectoryPlayer {
  name: string
  aka?: string
  ranks?: { r: number | null }[]
}

interface TournamentFile {
  days: Record<string, { teams: { players: { id: string; name: string }[] }[] }[]>
}
const LIVE_TTL_MS = 10 * MINUTE_MS
const POPULAR_TTL_MS = 6 * HOUR_MS
const LINKER_TTL_MS = HOUR_MS
const MONTH = /^\d{4}-\d{2}$/

const memo = <T>(ttl: number, load: () => Promise<T>) => {
  let hit: { at: number; value: Promise<T> } | null = null
  return () => {
    if (!hit || Date.now() - hit.at > ttl) {
      const value = load()
      hit = { at: Date.now(), value }
      value.catch(() => {
        hit = null
      })
    }
    return hit.value
  }
}

const merge = (...lists: NewsItem[][]) => [...new Map(lists.flat().map((i) => [i.id, i])).values()].sort(byNewest)

export const isNewsMonth = (m: string) => MONTH.test(m)

export const isSettledNewsMonth = (month: string) =>
  month < dayjs.utc().subtract(NEWS_FREEZE_MS, 'millisecond').format('YYYY-MM')

export const isSettledNewsTournament = (end: string) =>
  dayjs.utc(end).add(NEWS_FREEZE_MS, 'millisecond').isBefore(dayjs.utc())

export const isSettledNewsArticle = (publishedAt: string) =>
  dayjs.utc(publishedAt).add(NEWS_FREEZE_MS, 'millisecond').isBefore(dayjs.utc())

export const newsOfTournament = (items: NewsItem[], code: string) => items.filter((i) => i.tournaments.includes(code))

export const createNewsService = (root: string) => {
  const dataDir = path.join(root, 'public/data')
  const newsDir = path.join(dataDir, 'news')

  const events = memo(LINKER_TTL_MS, async () => {
    const files = (await fs.readdir(dataDir)).filter((f) => /^calendar-\d{4}\.json$/.test(f))
    const calendars = await Promise.all(
      files.map((f) => readJson<{ events: (NewsEvent & { end: string })[] }>(path.join(dataDir, f))),
    )
    return calendars.flatMap((c) => c?.events ?? [])
  })

  const linker = memo(LINKER_TTL_MS, async () => {
    const catalog = await readJson<{ series: NewsSeries[] }>(path.join(root, 'data/catalog.json'))
    return createNewsLinker(await events(), catalog?.series ?? [])
  })

  const head = memo(LIVE_TTL_MS, async () => {
    const [page, link] = await Promise.all([fetchNewsPage(1, LIVE_PAGE), linker()])
    return page.data.map(link).filter((i) => i !== null)
  })

  const snapshotMonth = async (month: string) =>
    (await readJson<NewsMonth>(path.join(newsDir, `${month}.json`)))?.items ?? []

  const snapshotIndex = () => readJson<NewsIndex>(path.join(newsDir, 'index.json'))

  const popular = memo(POPULAR_TTL_MS, async () => {
    const [slugs, live, snap, link] = await Promise.all([fetchPopularSlugs(), head(), snapshotIndex(), linker()])
    const known = new Map([...(snap?.popular ?? []), ...(snap?.latest ?? []), ...live].map((i) => [i.slug, i]))
    const resolved = await Promise.all(
      slugs.map(async (slug) => {
        const hit = known.get(slug)
        if (hit) return hit
        const raw = await fetchNewsBySlug(slug).catch(() => null)
        return raw ? link(raw) : null
      }),
    )
    return resolved.filter((i) => i !== null)
  })

  const month = async (m: string): Promise<NewsMonth> => {
    const snap = await snapshotMonth(m)
    if (isSettledNewsMonth(m)) return { month: m, items: snap }
    const live = (await head()).filter((i) => newsMonthOf(i) === m)
    return { month: m, items: merge(snap, live) }
  }

  const index = async (): Promise<NewsIndex> => {
    const [snap, live, top] = await Promise.all([snapshotIndex(), head(), popular().catch(() => null)])
    const liveMonths = uniq(live.map(newsMonthOf))
    const recent = await Promise.all(liveMonths.map(month))
    const counts = new Map((snap?.months ?? []).map((c) => [c.month, c.count]))
    for (const r of recent) counts.set(r.month, r.items.length)
    return {
      asOf: nowIso(),
      latest: merge(snap?.latest ?? [], live).slice(0, NEWS_LATEST),
      popular: top ?? snap?.popular ?? [],
      months: [...counts].map(([m, count]) => ({ month: m, count })).sort((a, b) => b.month.localeCompare(a.month)),
    }
  }

  const tournament = async (code: string): Promise<{ news: NewsTournament; settled: boolean } | null> => {
    const event = (await events()).find((e) => e.code === code)
    if (!event) return null
    const snap = (await readJson<NewsTournament>(path.join(newsDir, 'tournaments', `${code}.json`)))?.items ?? []
    const settled = isSettledNewsTournament(event.end)
    const items = settled ? snap : merge(snap, newsOfTournament(await head(), code))
    return { news: { code, items }, settled }
  }

  const slugIds = memo(LINKER_TTL_MS, async () => {
    const snap = await snapshotIndex()
    const months = await Promise.all((snap?.months ?? []).map((m) => snapshotMonth(m.month)))
    const live = await head().catch((): NewsItem[] => [])
    return new Map([...months.flat(), ...live].map((i) => [i.slug, i.id]))
  })

  const builder = memo(LINKER_TTL_MS, async () => {
    const [evs, ids] = await Promise.all([events(), slugIds()])
    const codeOf = new Map(evs.map((e) => [e.tmtId, e.code]))
    return createArticleBuilder({ tournamentOf: (t) => codeOf.get(t), newsOf: (s) => ids.get(s) })
  })

  const directory = memo(LINKER_TTL_MS, async () => {
    const file = await readJson<{ players: Record<string, DirectoryPlayer> }>(path.join(dataDir, 'players.json'))
    const entries = Object.entries(file?.players ?? {})
    const namesOf = new Map(entries.map(([id, p]) => [id, [p.name, p.aka ?? ''].filter(Boolean)]))
    const ranked = entries
      .filter(([, p]) => p.ranks?.some((r) => r.r !== null && r.r <= RANKED_TOP))
      .map(([id]): PlayerName => ({ id, names: namesOf.get(id) ?? [] }))
    return { namesOf, ranked }
  })

  const candidatesFor = async (codes: string[]): Promise<PlayerName[]> => {
    const [{ namesOf, ranked }, files] = await Promise.all([
      directory(),
      Promise.all(codes.map((c) => readJson<TournamentFile>(path.join(dataDir, 'tournaments', `${c}.json`)))),
    ])
    const entrants = new Map<string, Set<string>>()
    for (const f of files)
      for (const m of Object.values(f?.days ?? {}).flat())
        for (const p of m.teams.flatMap((t) => t.players))
          entrants.set(p.id, (entrants.get(p.id) ?? new Set(namesOf.get(p.id))).add(p.name))
    if (!entrants.size) return ranked
    return [
      ...[...entrants].map(([id, names]) => ({ id, names: [...names] })),
      ...ranked.filter((p) => !entrants.has(p.id)),
    ]
  }

  const liveArticles = new Map<string, { at: number; article: NewsArticle }>()

  const article = async (id: string): Promise<{ article: NewsArticle; settled: boolean } | null> => {
    const snap = await readJson<NewsArticle>(path.join(newsDir, 'articles', `${id}.json`))
    if (snap && isSettledNewsArticle(snap.publishedAt)) return { article: snap, settled: true }
    const hit = liveArticles.get(id)
    if (hit && Date.now() - hit.at < LIVE_TTL_MS) return { article: hit.article, settled: false }
    const raw = await fetchNewsPost(Number(id)).catch(() => null)
    const [link, build] = await Promise.all([linker(), builder()])
    const item = raw ? link(raw) : null
    if (!raw || !item) return snap ? { article: snap, settled: false } : null
    const fresh = build(raw, item, await candidatesFor(item.tournaments))
    liveArticles.set(id, { at: Date.now(), article: fresh })
    return { article: fresh, settled: isSettledNewsArticle(fresh.publishedAt) }
  }

  return { index, month, tournament, article }
}
