import { createArticleBuilder } from '../../../server/news-blocks.ts';
import { NEWS_RANKED_TOP, withRanked, type PlayerName } from '../../../server/news-players.ts';
import {
  createNewsLinker,
  fetchNewsBySlug,
  fetchNewsPage,
  fetchPopularSlugs,
  NEWS_FREEZE_MS,
  newsMonthOf,
  newsSlugOf,
  publishedMs,
  type NewsRequest,
  type NewsSeries,
  type RawNews,
  type RawNewsPage,
} from '../../../server/news.ts';
import { WORLD } from '../bwf.ts';
import type { Context } from '../context.ts';
import { all, readState, tx, unzipJson, writeState, zipJson, type Db } from '../db.ts';
import { push, readJsonFile, readOverrides } from '../util.ts';

const PER_PAGE = 20;
const MAX_PAGES = 40;
const BUDGET_MS = 10 * 60_000;
const CURSOR = 'news.archive';
const SYNC_REQUEST: NewsRequest = { timeoutMs: 90_000, retries: 2 };

interface Stored {
  id: number;
  published: number;
  fetched_at: number;
}

interface Cursor {
  offset: number;
  total: number;
  done: boolean;
}

const readRaw = (db: Db) =>
  all<{ body: Uint8Array }>(db, 'SELECT body FROM news_raw').map((r) => unzipJson(r.body) as RawNews);

const isFrozen = (s: Stored) => s.fetched_at - s.published > NEWS_FREEZE_MS;

const fetchSpan = async (page: number) => {
  try {
    return await fetchNewsPage(page, PER_PAGE, SYNC_REQUEST);
  } catch (e) {
    console.warn(`  ! news page ${page}: ${(e as Error).message}; retrying as two half pages`);
    const half = PER_PAGE / 2;
    const a = await fetchNewsPage(page * 2 - 1, half, SYNC_REQUEST);
    const b = await fetchNewsPage(page * 2, half, SYNC_REQUEST);
    return { results: a.results, data: [...a.data, ...b.data] };
  }
};

const stopReason = (pages: number, maxPages: number, started: number) => {
  if (pages >= maxPages) return `page cap (${maxPages}) reached`;
  if (Date.now() - started > BUDGET_MS) return `time budget (${BUDGET_MS / 60_000} min) used`;
  return null;
};

const advance = (cursor: Cursor | null, page: number, total: number, stored: number) => {
  const base = cursor ?? { offset: 0, total, done: stored >= total };
  const covered = Math.max(0, base.offset + total - base.total);
  const reached = Math.min(page * PER_PAGE, total);
  const done = base.done || reached >= total;
  const next: Cursor = reached >= covered ? { offset: reached, total, done } : { ...base, done };
  return { covered, next };
};

const fetchArchive = async (db: Db, maxPages: number) => {
  const stored = new Map(all<Stored>(db, 'SELECT id, published, fetched_at FROM news_raw').map((s) => [s.id, s]));
  const upsert = db.prepare(
    `INSERT INTO news_raw (id, published, fetched_at, body) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET published = excluded.published, fetched_at = excluded.fetched_at, body = excluded.body`,
  );
  let cursor = readState<Cursor | null>(db, CURSOR, null);
  const started = Date.now();
  let written = 0;
  let pages = 0;
  let stop: string | null = null;
  for (let page = 1; ;) {
    stop = stopReason(pages, maxPages, started);
    if (stop) break;
    let res: RawNewsPage;
    try {
      res = await fetchSpan(page);
    } catch (e) {
      stop = `page ${page} failed: ${(e as Error).message}`;
      break;
    }
    pages++;
    const now = Date.now();
    const total = res.results.total_posts;
    const fresh = res.data.filter((r) => {
      const s = stored.get(r.id);
      return !s || !isFrozen(s);
    });
    for (const r of fresh) stored.set(r.id, { id: r.id, published: publishedMs(r), fetched_at: now });
    const { covered, next } = advance(cursor, page, total, stored.size);
    tx(db, () => {
      for (const r of fresh) upsert.run(r.id, publishedMs(r), now, zipJson(r));
      writeState(db, CURSOR, next);
    });
    cursor = next;
    written += fresh.length;
    if (page * PER_PAGE >= total || (!fresh.length && cursor.done)) break;
    page = fresh.length ? page + 1 : Math.max(page + 1, Math.floor(covered / PER_PAGE) + 1);
  }
  return { written, pages, total: stored.size, cursor, stop };
};

const lastPopular = (db: Db) =>
  all<{ slug: string }>(db, 'SELECT slug FROM news_popular ORDER BY rank').map((r) => r.slug);

const scrapePopular = async (db: Db) => {
  try {
    const slugs = await fetchPopularSlugs(SYNC_REQUEST);
    const insert = db.prepare('INSERT INTO news_popular (rank, slug, fetched_at) VALUES (?, ?, ?)');
    tx(db, () => {
      db.exec('DELETE FROM news_popular');
      slugs.forEach((slug, i) => insert.run(i + 1, slug, Date.now()));
    });
    return { slugs, note: `${slugs.length} popular` };
  } catch (e) {
    const slugs = lastPopular(db);
    console.warn(`  ! news popular: scrape failed, keeping the last known ${slugs.length}: ${(e as Error).message}`);
    return { slugs, note: `${slugs.length} popular (kept)` };
  }
};

const fetchPopular = async (db: Db) => {
  const { slugs, note } = await scrapePopular(db);
  const known = new Set(readRaw(db).map((r) => newsSlugOf(r.link)));
  const missing = slugs.filter((s) => !known.has(s));
  const upsert = db.prepare(
    'INSERT INTO news_raw (id, published, fetched_at, body) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
  );
  let failed = 0;
  for (const slug of missing) {
    try {
      const r = await fetchNewsBySlug(slug, SYNC_REQUEST);
      if (r) upsert.run(r.id, publishedMs(r), Date.now(), zipJson(r));
    } catch (e) {
      failed++;
      console.warn(`  ! news popular article ${slug}: ${(e as Error).message}`);
    }
  }
  return failed ? `${note}, ${failed} missing` : note;
};

const candidatesFrom = (db: Db, overridesFile: string) => {
  const overrides = readOverrides(overridesFile);
  const names = new Map<string, Set<string>>();
  const add = (id: string, name: string | undefined) => {
    const n = name?.trim();
    if (n) names.set(id, (names.get(id) ?? new Set()).add(n));
  };
  for (const r of all<{ id: string; name: string }>(db, 'SELECT id, name FROM players')) add(r.id, r.name);
  for (const r of all<{ id: string; name: string }>(db, 'SELECT DISTINCT player_id AS id, name FROM match_players'))
    add(r.id, r.name);
  for (const [id, o] of Object.entries(overrides)) add(id, o.name);
  const toName = (id: string): PlayerName => ({ id, names: [...(names.get(id) ?? [])] });
  const ranked = all<{ id: string }>(
    db,
    `SELECT player1 AS id FROM rankings WHERE ranking = ? AND rank <= ?
     UNION SELECT player2 FROM rankings WHERE ranking = ? AND rank <= ? AND player2 != ''`,
    WORLD,
    NEWS_RANKED_TOP,
    WORLD,
    NEWS_RANKED_TOP,
  ).map((r) => toName(r.id));
  const entrants = new Map<string, string[]>();
  for (const r of all<{ code: string; id: string }>(
    db,
    'SELECT DISTINCT m.edition AS code, mp.player_id AS id FROM match_players mp JOIN matches m ON m.id = mp.match_id',
  ))
    push(entrants, r.code, r.id);
  const cache = new Map<string, PlayerName[]>();
  return (codes: string[]) => {
    const key = [...codes].sort((a, b) => a.localeCompare(b)).join(',');
    const hit =
      cache.get(key) ?? withRanked([...new Set(codes.flatMap((c) => entrants.get(c) ?? []))].map(toName), ranked);
    cache.set(key, hit);
    return hit;
  };
};

const derive = (db: Db, catalogFile: string, overridesFile: string) => {
  const series = readJsonFile<{ series: NewsSeries[] }>(catalogFile).series;
  const events = all<{ code: string; tmt_id: number; series_id: string; start: string }>(
    db,
    'SELECT code, tmt_id, series_id, start FROM editions',
  ).map((e) => ({ code: e.code, tmtId: e.tmt_id, series: e.series_id, start: e.start }));
  const link = createNewsLinker(events, series);
  const linked = readRaw(db)
    .map((raw) => ({ raw, item: link(raw) }))
    .filter((r) => r.item !== null);
  const items = linked.map((r) => r.item).filter((i) => i !== null);
  const codeOf = new Map(events.map((e) => [e.tmtId, e.code]));
  const idOf = new Map(items.map((i) => [i.slug, i.id]));
  const build = createArticleBuilder({ tournamentOf: (tmt) => codeOf.get(tmt), newsOf: (slug) => idOf.get(slug) });
  const candidates = candidatesFrom(db, overridesFile);
  const insertArticle = db.prepare('INSERT INTO news_articles (id, article) VALUES (?, ?)');
  const insert = db.prepare('INSERT INTO news (id, month, published_at, item) VALUES (?, ?, ?, ?)');
  const insertTournament = db.prepare('INSERT INTO news_tournaments (news_id, code) VALUES (?, ?)');
  const insertPlayer = db.prepare('INSERT INTO news_players (news_id, player_id) VALUES (?, ?)');
  tx(db, () => {
    db.exec('DELETE FROM news_articles; DELETE FROM news_tournaments; DELETE FROM news_players; DELETE FROM news;');
    for (const i of items) {
      insert.run(Number(i.id), newsMonthOf(i), i.publishedAt, JSON.stringify(i));
      for (const code of i.tournaments) insertTournament.run(Number(i.id), code);
      for (const p of i.players) insertPlayer.run(Number(i.id), p);
    }
    for (const { raw, item } of linked)
      if (item) insertArticle.run(Number(item.id), JSON.stringify(build(raw, item, candidates(item.tournaments))));
  });
  return items;
};

const cursorNote = (c: Cursor | null) => {
  if (!c) return 'archive not started';
  return c.done ? 'archive complete' : `backfill ${Math.min(c.offset, c.total)}/${c.total}`;
};

export const syncNews = async (
  { db }: Context,
  {
    offline,
    catalogFile,
    overridesFile,
    maxPages = MAX_PAGES,
  }: { offline: boolean; catalogFile: string; overridesFile: string; maxPages?: number },
) => {
  let note = 'offline';
  if (!offline) {
    const a = await fetchArchive(db, maxPages);
    if (a.stop) console.warn(`  ! news: ${a.stop}; kept ${a.total} stored, the next run resumes`);
    const popular = await fetchPopular(db);
    note = `${a.pages} pages · ${a.written} refreshed · ${a.total} stored · ${cursorNote(a.cursor)} · ${popular}`;
  }
  const items = derive(db, catalogFile, overridesFile);
  console.log(
    `news: ${items.length} articles · ${items.filter((i) => i.tournaments.length).length} linked to tournaments · ${note}`,
  );
};
