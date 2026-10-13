import fs from 'node:fs'
import path from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

import { createArticleBuilder } from '../../../server/news-blocks.ts'
import type { PlayerName } from '../../../server/news-players.ts'
import {
  createNewsLinker,
  fetchNewsBySlug,
  fetchNewsPage,
  fetchPopularSlugs,
  NEWS_FREEZE_MS,
  newsMonthOf,
  publishedMs,
  type NewsSeries,
  type RawNews,
} from '../../../server/news.ts'
import { WORLD } from '../bwf.ts'
import type { Context } from '../context.ts'
import { all, tx, type Db } from '../db.ts'

const PER_PAGE = 50

interface Stored {
  id: number
  published: number
  fetched_at: number
}

const isFrozen = (s: Stored) => s.fetched_at - s.published > NEWS_FREEZE_MS

const fetchArchive = async (db: Db) => {
  const stored = new Map(all<Stored>(db, 'SELECT id, published, fetched_at FROM news_raw').map((s) => [s.id, s]))
  const upsert = db.prepare(
    `INSERT INTO news_raw (id, published, fetched_at, body) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET published = excluded.published, fetched_at = excluded.fetched_at, body = excluded.body`,
  )
  let written = 0
  let pages = 0
  for (let page = 1; ; page++) {
    const res = await fetchNewsPage(page, PER_PAGE)
    pages++
    const now = Date.now()
    const fresh = res.data.filter((r) => {
      const s = stored.get(r.id)
      return !s || !isFrozen(s)
    })
    tx(db, () => {
      for (const r of fresh) {
        const published = publishedMs(r)
        upsert.run(r.id, published, now, gzipSync(JSON.stringify(r)))
        stored.set(r.id, { id: r.id, published, fetched_at: now })
      }
    })
    written += fresh.length
    const backfilling = stored.size < res.results.total_posts
    if (page >= res.results.total_pages || (!fresh.length && !backfilling)) break
  }
  return { written, pages, total: stored.size }
}

const fetchPopular = async (db: Db, raws: Map<string, RawNews>) => {
  const slugs = await fetchPopularSlugs()
  if (!slugs.length) return 0
  const missing = slugs.filter((s) => !raws.has(s))
  const upsert = db.prepare(
    'INSERT INTO news_raw (id, published, fetched_at, body) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
  )
  for (const slug of missing) {
    const r = await fetchNewsBySlug(slug).catch(() => null)
    if (r) upsert.run(r.id, publishedMs(r), Date.now(), gzipSync(JSON.stringify(r)))
  }
  const insert = db.prepare('INSERT INTO news_popular (rank, slug, fetched_at) VALUES (?, ?, ?)')
  tx(db, () => {
    db.exec('DELETE FROM news_popular')
    slugs.forEach((slug, i) => insert.run(i + 1, slug, Date.now()))
  })
  return slugs.length
}

const readRaw = (db: Db) =>
  all<{ body: Uint8Array }>(db, 'SELECT body FROM news_raw').map(
    (r) => JSON.parse(gunzipSync(r.body).toString('utf8')) as RawNews,
  )

const slugOf = (r: RawNews) => decodeURIComponent(r.link.split('/').filter(Boolean).at(-1) ?? '')

const RANKED_TOP = 200

const candidatesFrom = (db: Db, overridesFile: string) => {
  const overrides = fs.existsSync(overridesFile)
    ? ((JSON.parse(fs.readFileSync(overridesFile, 'utf8')) as { players?: Record<string, { name?: string }> })
        .players ?? {})
    : {}
  const names = new Map<string, Set<string>>()
  const add = (id: string, name: string | undefined) => {
    const n = name?.trim()
    if (n) names.set(id, (names.get(id) ?? new Set()).add(n))
  }
  for (const r of all<{ id: string; name: string }>(db, 'SELECT id, name FROM players')) add(r.id, r.name)
  for (const r of all<{ id: string; name: string }>(db, 'SELECT DISTINCT player_id AS id, name FROM match_players'))
    add(r.id, r.name)
  for (const [id, o] of Object.entries(overrides)) add(id, o.name)
  const toName = (id: string): PlayerName => ({ id, names: [...(names.get(id) ?? [])] })
  const ranked = all<{ id: string }>(
    db,
    `SELECT player1 AS id FROM rankings WHERE ranking = ? AND rank <= ?
     UNION SELECT player2 FROM rankings WHERE ranking = ? AND rank <= ? AND player2 != ''`,
    WORLD,
    RANKED_TOP,
    WORLD,
    RANKED_TOP,
  ).map((r) => toName(r.id))
  const entrants = new Map<string, string[]>()
  for (const r of all<{ code: string; id: string }>(
    db,
    'SELECT DISTINCT m.edition AS code, mp.player_id AS id FROM match_players mp JOIN matches m ON m.id = mp.match_id',
  ))
    entrants.set(r.code, [...(entrants.get(r.code) ?? []), r.id])
  const cache = new Map<string, PlayerName[]>()
  return (codes: string[]) => {
    const ids = [...new Set(codes.flatMap((c) => entrants.get(c) ?? []))]
    if (!ids.length) return ranked
    const key = [...codes].sort((a, b) => a.localeCompare(b)).join(',')
    const known = new Set(ids)
    const hit = cache.get(key) ?? [...ids.map(toName), ...ranked.filter((p) => !known.has(p.id))]
    cache.set(key, hit)
    return hit
  }
}

const derive = (db: Db, catalogFile: string) => {
  const series = (JSON.parse(fs.readFileSync(catalogFile, 'utf8')) as { series: NewsSeries[] }).series
  const events = all<{ code: string; tmt_id: number; series_id: string; start: string }>(
    db,
    'SELECT code, tmt_id, series_id, start FROM editions',
  ).map((e) => ({ code: e.code, tmtId: e.tmt_id, series: e.series_id, start: e.start }))
  const link = createNewsLinker(events, series)
  const linked = readRaw(db)
    .map((raw) => ({ raw, item: link(raw) }))
    .filter((r) => r.item !== null)
  const items = linked.map((r) => r.item).filter((i) => i !== null)
  const codeOf = new Map(events.map((e) => [e.tmtId, e.code]))
  const idOf = new Map(items.map((i) => [i.slug, i.id]))
  const build = createArticleBuilder({ tournamentOf: (tmt) => codeOf.get(tmt), newsOf: (slug) => idOf.get(slug) })
  const candidates = candidatesFrom(db, path.join(path.dirname(catalogFile), 'overrides.json'))
  const insertArticle = db.prepare('INSERT INTO news_articles (id, article) VALUES (?, ?)')
  const insert = db.prepare('INSERT INTO news (id, month, published_at, item) VALUES (?, ?, ?, ?)')
  const insertTournament = db.prepare('INSERT INTO news_tournaments (news_id, code) VALUES (?, ?)')
  const insertPlayer = db.prepare('INSERT INTO news_players (news_id, player_id) VALUES (?, ?)')
  tx(db, () => {
    db.exec('DELETE FROM news_articles; DELETE FROM news_tournaments; DELETE FROM news_players; DELETE FROM news;')
    for (const i of items) {
      insert.run(Number(i.id), newsMonthOf(i), i.publishedAt, JSON.stringify(i))
      for (const code of i.tournaments) insertTournament.run(Number(i.id), code)
      for (const p of i.players) insertPlayer.run(Number(i.id), p)
    }
    for (const { raw, item } of linked)
      if (item) insertArticle.run(Number(item.id), JSON.stringify(build(raw, item, candidates(item.tournaments))))
  })
  return items
}

export const syncNews = async (
  { db }: Context,
  { offline, catalogFile }: { offline: boolean; catalogFile: string },
) => {
  let note = 'offline'
  if (!offline) {
    try {
      const a = await fetchArchive(db)
      const raws = new Map(readRaw(db).map((r) => [slugOf(r), r]))
      const popular = await fetchPopular(db, raws).catch((e: Error) => {
        console.warn(`  ! news popular: ${e.message}`)
        return 0
      })
      note = `${a.pages} pages · ${a.written} refreshed · ${a.total} stored · ${popular} popular`
    } catch (e) {
      console.warn(`  ! news: ${(e as Error).message}`)
      note = 'fetch failed, kept cache'
    }
  }
  const items = derive(db, catalogFile)
  console.log(
    `news: ${items.length} articles · ${items.filter((i) => i.tournaments.length).length} linked to tournaments · ${note}`,
  )
}
