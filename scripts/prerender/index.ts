import fs from 'node:fs';
import path from 'node:path';

import { lingui } from '@lingui/vite-plugin';
import { createServer } from 'vite-plus';

import { localeInPath, SOURCE_LOCALE, stripLocale, withLocale, type Locale } from '../../src/i18n/locales.ts';
import { RENDER_ENTRY, type CreateRenderer, type PrerenderPage } from './contract.ts';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(PUBLIC, 'data');
const SITEMAP = path.join(PUBLIC, 'sitemap.xml');
const VARIANTS = '_pages';
const QUERY_PAGES: Record<string, string> = { '/calendar': 'year', '/rankings': 'kind' };
const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const started = performance.now();

const unescapeXml = (s: string) => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => XML_ENTITIES[e] ?? '');

const readLocs = (file: string): string[] => {
  const xml = fs.readFileSync(file, 'utf8');
  const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => unescapeXml(m[1] ?? ''));
  if (!xml.includes('<sitemapindex')) return locs;
  return locs.flatMap((loc) => {
    const part = path.join(PUBLIC, path.basename(new URL(loc).pathname));
    return fs.existsSync(part) ? readLocs(part) : [];
  });
};

const pagesOf = (locs: readonly string[]) => {
  const groups = new Map<string, { path: string; search: string; locales: Locale[] }>();
  for (const loc of locs) {
    const url = new URL(loc);
    const locale = localeInPath(url.pathname) ?? SOURCE_LOCALE;
    const bare = stripLocale(url.pathname);
    const key = `${bare}${url.search}`;
    const group = groups.get(key) ?? { path: bare, search: url.search.slice(1), locales: [] };
    group.locales.push(locale);
    groups.set(key, group);
  }
  return [...groups.values()]
    .flatMap((g) => g.locales.map((locale): PrerenderPage => ({ ...g, locale })))
    .sort((a, b) => a.locale.localeCompare(b.locale));
};

const outputFile = (page: PrerenderPage) => {
  const param = QUERY_PAGES[page.path];
  if (param) {
    const value = new URLSearchParams(page.search).get(param);
    return path.join(DIST, VARIANTS, page.locale, `${page.path}${value ? `/${value}` : ''}.html`);
  }
  return path.join(DIST, decodeURIComponent(withLocale(page.path, page.locale as Locale)), 'index.html');
};

const readJson = (file: string): unknown => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  } catch {
    return undefined;
  }
};

const finish = (message: string) => {
  console.log(`prerender: ${message} · ${((performance.now() - started) / 1000).toFixed(1)}s`);
};

const run = async () => {
  if (process.env.PRERENDER === '0') return finish('skipped (PRERENDER=0)');
  if (!fs.existsSync(SITEMAP)) return finish('skipped, no public/sitemap.xml (run pnpm sync first)');
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const locs = readLocs(SITEMAP);
  const origin = locs[0] ? new URL(locs[0]).origin : '';
  const pages = pagesOf(locs);
  const locales = [...new Set(pages.map((p) => p.locale))];

  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'warn',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [lingui({ macroTransform: true })],
    resolve: { tsconfigPaths: true },
  });

  try {
    const loadCatalog = async (locale: string) => {
      const file = `/src/locales/${locale}.po`;
      if (fs.existsSync(path.join(ROOT, file))) return (await server.ssrLoadModule(file)).messages;
      console.warn(`prerender: no catalog for ${locale} yet, its pages fall back to English text`);
      return {};
    };
    const catalogs = Object.fromEntries(
      await Promise.all(locales.map(async (l) => [l, await loadCatalog(l)] as const)),
    );
    const { createRenderer } = (await server.ssrLoadModule(RENDER_ENTRY)) as { createRenderer: CreateRenderer };
    const renderer = createRenderer({ origin, template, readJson, catalogs });
    const dirs = new Set<string>();
    const perLocale = new Map<string, number>();
    const missing: string[] = [];
    let bytes = 0;

    for (const page of pages) {
      const html = renderer.render(page);
      const file = outputFile(page);
      if (!html || !file.startsWith(`${DIST}${path.sep}`)) {
        missing.push(withLocale(page.path, page.locale as Locale) + (page.search ? `?${page.search}` : ''));
        continue;
      }
      const dir = path.dirname(file);
      if (!dirs.has(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        dirs.add(dir);
      }
      fs.writeFileSync(file, html);
      bytes += Buffer.byteLength(html);
      perLocale.set(page.locale, (perLocale.get(page.locale) ?? 0) + 1);
    }

    const written = [...perLocale.values()].reduce((sum, n) => sum + n, 0);
    const split = [...perLocale].map(([l, n]) => `${l} ${n}`).join(', ');
    if (missing.length)
      console.warn(`prerender: no data for ${missing.length} pages, e.g. ${missing.slice(0, 5).join(' ')}`);
    finish(`${written} pages (${split}) · ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  } finally {
    await server.close();
  }
};

await run();
