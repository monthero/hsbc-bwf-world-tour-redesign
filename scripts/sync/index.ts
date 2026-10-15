import path from 'node:path';
import { parseArgs } from 'node:util';

import { loadCatalog } from './catalog.ts';
import type { Context } from './context.ts';
import { todayIso } from './dates.ts';
import { openDb } from './db.ts';
import { exportData } from './export.ts';
import { createClient, httpStats } from './http.ts';
import { exportNews } from './news-export.ts';
import { createOutput } from './output.ts';
import { exportPlayerMedia } from './player-media-export.ts';
import { exportSitemap } from './sitemap-export.ts';
import { syncCalendar } from './steps/calendar.ts';
import { syncDetails } from './steps/details.ts';
import { syncImages } from './steps/images.ts';
import { syncMatches } from './steps/matches.ts';
import { syncNews } from './steps/news.ts';
import { syncPlayers } from './steps/players.ts';
import { syncRankings } from './steps/rankings.ts';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FIRST_SEASON = 2018;
const STEPS = ['calendar', 'details', 'matches', 'players', 'rankings', 'news', 'images', 'export'] as const;

const { values } = parseArgs({
  options: {
    only: { type: 'string' },
    from: { type: 'string' },
    offline: { type: 'boolean', default: false },
    db: { type: 'string' },
    'news-pages': { type: 'string' },
  },
});

const today = todayIso();
const currentYear = Number(today.slice(0, 4));
const from = Number(values.from ?? FIRST_SEASON);
const only = new Set(values.only?.split(',') ?? STEPS);

const OVERRIDES = path.join(ROOT, 'data/overrides.json');
const CATALOG = path.join(ROOT, 'data/catalog.json');
const OUT = path.join(ROOT, 'public/data');
const offline = values.offline;

const db = openDb(values.db ? path.resolve(values.db) : path.join(ROOT, 'data/bwf.sqlite'), path.join(ROOT, 'data'));
const ctx: Context = {
  db,
  client: createClient(db, { offline }),
  catalog: loadCatalog(CATALOG),
  years: Array.from({ length: currentYear - from + 2 }, (_, i) => from + i),
  currentYear,
  today,
};

const started = Date.now();
if (only.has('calendar')) await syncCalendar(ctx);
if (only.has('details')) await syncDetails(ctx);
if (only.has('matches')) await syncMatches(ctx);
if (only.has('players')) await syncPlayers(ctx);
if (only.has('rankings')) await syncRankings(ctx);
if (only.has('news'))
  await syncNews(ctx, {
    offline,
    catalogFile: CATALOG,
    overridesFile: OVERRIDES,
    maxPages: values['news-pages'] ? Number(values['news-pages']) : undefined,
  });
if (only.has('images')) await syncImages(ROOT, OVERRIDES, offline);
if (only.has('export')) {
  const output = createOutput(OUT);
  await exportData(
    db,
    ctx.client,
    path.join(ROOT, 'public'),
    currentYear,
    OVERRIDES,
    path.join(ROOT, 'data/reports/missing-photos.csv'),
    output,
  );
  exportNews(db, output);
  exportPlayerMedia(db, output, OUT, path.join(ROOT, 'data/media'));
  const pruned = output.prune();
  if (pruned) console.log(`export: removed ${pruned} stale files`);
  exportSitemap(db, path.join(ROOT, 'public'), today);
}

const s = httpStats();
console.log(
  `done in ${Math.round((Date.now() - started) / 1000)}s · ${s.network} downloaded · ${s.cached} from cache · ${s.failed} failed`,
);
db.close();
