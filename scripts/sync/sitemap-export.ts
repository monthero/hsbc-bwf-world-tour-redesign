import fs from 'node:fs';
import path from 'node:path';

import { LOCALE_META, SOURCE_LOCALE, withLocale, type Locale } from '../../src/i18n/locales.ts';
import { KEY_SEASONS_AHEAD, KEY_TOP_PLAYERS, pageLocales } from '../prerender/scope.ts';
import { RACE, WORLD, WORLD_CATEGORIES } from './bwf.ts';
import { all, type Db } from './db.ts';

export const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://hsbc-bwf-world-tour-redesign.vercel.app').replace(
  /\/+$/,
  '',
);

const MAX_URLS = 50_000;
const MAX_BYTES = 50 * 1024 * 1024;
const XMLNS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const XHTMLNS = 'http://www.w3.org/1999/xhtml';
const INDEX = 'sitemap.xml';
const PART = /^sitemap-\d+\.xml$/;

interface Entry {
  path: string;
  lastmod?: string | null;
  key?: boolean;
}

const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] ?? c);

const element = (tag: string, loc: string, lastmod?: string | null, links = '') =>
  `<${tag}><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${links}</${tag}>`;

const xmlFile = (root: 'urlset' | 'sitemapindex', items: readonly string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="${XMLNS}"${root === 'urlset' ? ` xmlns:xhtml="${XHTMLNS}"` : ''}>\n${items.join('\n')}\n</${root}>\n`;

const alternateLink = (hreflang: string, href: string) =>
  `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}"/>`;

const localizedUrls = (e: Entry) => {
  const locales = pageLocales(!!e.key);
  const href = (locale: Locale) => `${SITE_ORIGIN}${withLocale(e.path, locale)}`;
  const links =
    locales.length > 1
      ? [
          ...locales.map((l) => alternateLink(LOCALE_META[l].lang, href(l))),
          alternateLink('x-default', href(SOURCE_LOCALE)),
        ].join('')
      : '';
  return locales.map((l) => element('url', href(l), e.lastmod, links));
};

const chunk = (items: readonly string[]) => {
  const overhead = Buffer.byteLength(xmlFile('urlset', []));
  const chunks: string[][] = [];
  let current: string[] = [];
  let bytes = overhead;
  for (const item of items) {
    const size = Buffer.byteLength(item) + 1;
    if (current.length && (current.length >= MAX_URLS || bytes + size > MAX_BYTES)) {
      chunks.push(current);
      current = [];
      bytes = overhead;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length) chunks.push(current);
  return chunks;
};

const writeIfChanged = (file: string, content: string) => {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.writeFileSync(file, content);
};

const entriesOf = (db: Db, today: string): Entry[] => {
  const pubDate = (ranking: number) =>
    all<{ date: string }>(db, 'SELECT date FROM publications WHERE ranking = ?', ranking)[0]?.date ?? null;
  const latestNews = all<{ day: string | null }>(db, 'SELECT substr(MAX(published_at), 1, 10) AS day FROM news')[0]
    ?.day;
  const seasons = all<{ season: number; updated: string }>(
    db,
    'SELECT season, MIN(MAX(end), ?) AS updated FROM editions GROUP BY season ORDER BY season DESC',
    today,
  );
  const current = Number(today.slice(0, 4));
  const keySeason = (season: number) => season >= current && season <= current + KEY_SEASONS_AHEAD;
  const topPlayers = new Set(
    all<{ player1: string; player2: string }>(
      db,
      `SELECT player1, player2 FROM rankings WHERE ranking = ? AND rank <= ? AND category IN (${Object.keys(WORLD_CATEGORIES).join(',')})`,
      WORLD,
      KEY_TOP_PLAYERS,
    ).flatMap((r) => [r.player1, r.player2].filter(Boolean)),
  );

  const editions = all<{ season: number; slug: string; start: string; end: string; archived: number }>(
    db,
    'SELECT season, slug, start, end, archived FROM editions ORDER BY start DESC, code',
  );
  const players = all<{ id: string; last_played: string }>(
    db,
    'SELECT id, last_played FROM players ORDER BY last_played DESC, id',
  );
  const news = all<{ id: number; day: string }>(
    db,
    'SELECT id, substr(published_at, 1, 10) AS day FROM news ORDER BY published_at DESC, id DESC',
  );

  const tournamentLastmod = (e: (typeof editions)[number]) => {
    if (e.archived) return e.end;
    return e.start <= today ? today : null;
  };

  return [
    { path: '/calendar', lastmod: seasons.find((s) => s.season === current)?.updated, key: true },
    ...seasons
      .filter((s) => s.season !== current)
      .map((s) => ({
        path: `/calendar?year=${s.season}`,
        lastmod: s.season < current ? s.updated : null,
        key: keySeason(s.season),
      })),
    { path: '/rankings', lastmod: pubDate(WORLD), key: true },
    { path: '/rankings?kind=race', lastmod: pubDate(RACE), key: true },
    { path: '/news', lastmod: latestNews, key: true },
    { path: '/about', key: true },
    { path: '/credits', key: false },
    ...editions.map((e) => ({
      path: `/world-tour/${e.season}/${encodeURIComponent(e.slug)}`,
      lastmod: tournamentLastmod(e),
      key: keySeason(e.season),
    })),
    ...players.map((p) => ({
      path: `/players/${encodeURIComponent(p.id)}`,
      lastmod: p.last_played || null,
      key: topPlayers.has(p.id),
    })),
    ...news.map((n) => ({ path: `/news/${n.id}`, lastmod: n.day })),
  ];
};

export const exportSitemap = (db: Db, publicDir: string, today: string) => {
  const entries = entriesOf(db, today);
  const urls = entries.flatMap(localizedUrls);
  const chunks = chunk(urls);
  const parts = chunks.length > 1 ? chunks.map((_, i) => `sitemap-${i + 1}.xml`) : [];

  for (const file of fs.readdirSync(publicDir))
    if (PART.test(file) && !parts.includes(file)) fs.rmSync(path.join(publicDir, file));

  if (parts.length) {
    chunks.forEach((list, i) => writeIfChanged(path.join(publicDir, `sitemap-${i + 1}.xml`), xmlFile('urlset', list)));
    writeIfChanged(
      path.join(publicDir, INDEX),
      xmlFile(
        'sitemapindex',
        parts.map((file) => element('sitemap', `${SITE_ORIGIN}/${file}`, today)),
      ),
    );
  } else writeIfChanged(path.join(publicDir, INDEX), xmlFile('urlset', chunks[0] ?? []));

  console.log(
    `export sitemap: ${urls.length} urls (${entries.length} pages, ${urls.length - entries.length} localized) · ${parts.length ? `${parts.length} files + index` : '1 file'} · ${SITE_ORIGIN}`,
  );
};
