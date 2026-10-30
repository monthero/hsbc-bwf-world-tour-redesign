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
import { syncVideos } from './steps/videos.ts';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FIRST_SEASON = 2018;
const STEPS = ['calendar', 'details', 'matches', 'players', 'rankings', 'news', 'images', 'videos', 'export'] as const;

const { values } = parseArgs({
  options: {
    only: { type: 'string' },
    skip: { type: 'string' },
    from: { type: 'string' },
    offline: { type: 'boolean', default: false },
    players: { type: 'string' },
    db: { type: 'string' },
    'news-pages': { type: 'string' },
  },
});

const today = todayIso();
const currentYear = Number(today.slice(0, 4));
const from = Number(values.from ?? FIRST_SEASON);
const only = new Set(values.only?.split(',') ?? STEPS);
const skip = new Set(values.skip?.split(',') ?? []);

const OVERRIDES = path.join(ROOT, 'data/overrides.json');
const CATALOG = path.join(ROOT, 'data/catalog.json');
const OUT = path.join(ROOT, 'public/data');
const offline = values.offline;
const onlyPlayers = values.players ? new Set(values.players.split(',')) : undefined;

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
const timings: string[] = [];
const hasRankings = () => !!db.prepare('SELECT 1 FROM rankings LIMIT 1').get();
const skipped = (name: (typeof STEPS)[number]) =>
  !only.has(name) || (skip.has(name) && !(name === 'rankings' && !hasRankings()));

const step = async (name: (typeof STEPS)[number], run: () => unknown) => {
  if (skipped(name)) return;
  const at = Date.now();
  const before = httpStats();
  await run();
  const secs = ((Date.now() - at) / 1000).toFixed(1);
  timings.push(`${name} ${secs}s`);
  console.log(`  ${name} took ${secs}s, ${httpStats().network - before.network} downloaded`);
};

await step('calendar', () => syncCalendar(ctx));
await step('details', () => syncDetails(ctx));
await step('matches', () => syncMatches(ctx));
await step('players', () => syncPlayers(ctx));
await step('rankings', () => syncRankings(ctx));
await step('news', () =>
  syncNews(ctx, {
    offline,
    catalogFile: CATALOG,
    overridesFile: OVERRIDES,
    maxPages: values['news-pages'] ? Number(values['news-pages']) : undefined,
  }),
);
await step('images', () => syncImages(ROOT, OVERRIDES, offline));
await step('videos', () => syncVideos(db, ROOT, offline ? undefined : process.env.YOUTUBE_API_KEY));
await step('export', async () => {
  const output = createOutput(OUT);
  await exportData(
    db,
    ctx.client,
    path.join(ROOT, 'public'),
    currentYear,
    OVERRIDES,
    path.join(ROOT, 'data/reports/missing-photos.csv'),
    output,
    onlyPlayers,
  );
  if (onlyPlayers) return;
  exportNews(db, output);
  exportPlayerMedia(db, output, OUT, path.join(ROOT, 'data/media'));
  const pruned = output.prune();
  if (pruned) console.log(`export: removed ${pruned} stale files`);
  exportSitemap(db, path.join(ROOT, 'public'), today);
});

console.log(`timings: ${timings.join(' · ')}`);
const s = httpStats();
console.log(
  `done in ${Math.round((Date.now() - started) / 1000)}s · ${s.network} downloaded · ${s.cached} from cache · ${s.failed} failed · ${s.skipped} skipped after a recent 500`,
);
db.close();
