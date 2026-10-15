import fs from 'node:fs';
import path from 'node:path';

import { RACE, WORLD } from './bwf.ts';
import { all, type Db } from './db.ts';

export const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://hsbc-bwf-world-tour-redesign.vercel.app').replace(
  /\/+$/,
  '',
);

const MAX_URLS = 50_000;
const MAX_BYTES = 50 * 1024 * 1024;
const XMLNS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const INDEX = 'sitemap.xml';
const PART = /^sitemap-\d+\.xml$/;

interface Entry {
  path: string;
  lastmod?: string | null;
}

const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] ?? c);

const element = (tag: string, loc: string, lastmod?: string | null) =>
  `<${tag}><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</${tag}>`;

const xmlFile = (root: 'urlset' | 'sitemapindex', items: readonly string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="${XMLNS}">\n${items.join('\n')}\n</${root}>\n`;

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
    { path: '/calendar', lastmod: seasons.find((s) => s.season === current)?.updated },
    ...seasons
      .filter((s) => s.season !== current)
      .map((s) => ({ path: `/calendar?year=${s.season}`, lastmod: s.season < current ? s.updated : null })),
    { path: '/rankings', lastmod: pubDate(WORLD) },
    { path: '/rankings?kind=race', lastmod: pubDate(RACE) },
    { path: '/news', lastmod: latestNews },
    { path: '/about' },
    ...editions.map((e) => ({
      path: `/world-tour/${e.season}/${encodeURIComponent(e.slug)}`,
      lastmod: tournamentLastmod(e),
    })),
    ...players.map((p) => ({ path: `/players/${encodeURIComponent(p.id)}`, lastmod: p.last_played || null })),
    ...news.map((n) => ({ path: `/news/${n.id}`, lastmod: n.day })),
  ];
};

export const exportSitemap = (db: Db, publicDir: string, today: string) => {
  const urls = entriesOf(db, today).map((e) => element('url', `${SITE_ORIGIN}${e.path}`, e.lastmod));
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
    `export sitemap: ${urls.length} urls · ${parts.length ? `${parts.length} files + index` : '1 file'} · ${SITE_ORIGIN}`,
  );
};
