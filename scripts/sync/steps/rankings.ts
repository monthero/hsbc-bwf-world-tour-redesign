import { resolve } from 'node:path';

import {
  historyPath,
  historyPrefix,
  publicationsPath,
  RACE,
  RACE_CATEGORIES,
  rankingsListPath,
  rankingsListPrefix,
  rankingTablePath,
  weeklyPath,
  weeklyPrefix,
  WORLD,
  WORLD_CATEGORIES,
  type ApiHistory,
  type ApiHistoryRow,
  type ApiPublication,
  type ApiRankingInfo,
  type ApiRankingRow,
  type ApiRankingTable,
  type ApiWeekly,
  type ApiWeeklyRow,
} from '../bwf.ts';
import type { Context } from '../context.ts';
import { DAY_MS, HOUR_MS } from '../dates.ts';
import { all, readState, tx, writeState } from '../db.ts';
import { FOREVER, pool, within, type Cached, type Client } from '../http.ts';
import { photoOf } from '../normalize.ts';
import { collapseSpaces, readJsonFile } from '../util.ts';

const PUBLICATION_REFRESH = within(6 * HOUR_MS);
const LIST_REFRESH = within(7 * DAY_MS);
const DOUBLES = new Set(['MD', 'WD', 'XD']);
const PAGE_SIZES = [1000, 100, 10, 1];
const SPLIT_RETRIES = 1;
const WEEKLY_FLOOR = 2008;
const WEEKLY_GAP = 2;
const HISTORY_STATE = 'rankings.history';
const HISTORY_PER_RUN = 150;

interface HistoryState {
  key: string;
  done: string[];
}

const COUNTRIES = readJsonFile<Record<string, { name: string }>>(
  resolve(import.meta.dirname, '../../../src/utils/countries.json'),
);

const ALIASES: Record<string, string> = {
  Turkiye: 'TUR',
  'North Korea': 'PRK',
  'Brunei Darussalam': 'BRU',
  'National Olympic Commitee KENYA': 'KEN',
  'French Polynesia (Tahiti)': 'PYF',
  'Northern Marianas': 'MNP',
  'Athlete Independent Neutral': 'AIN',
  'MOROCCO Independent': 'AIN',
};

const CODE_OF = new Map([
  ...Object.entries(COUNTRIES).map(([ioc, c]): [string, string] => [c.name, ioc]),
  ...Object.entries(ALIASES),
]);

const plainName = (html: string | null | undefined) => collapseSpaces((html ?? '').replace(/<[^>]*>/g, ' '));

const unmapped = new Map<string, number>();

const countryOf = (name: string | null | undefined) => {
  if (!name) return '';
  const cc = CODE_OF.get(name);
  if (!cc) unmapped.set(name, (unmapped.get(name) ?? 0) + 1);
  return cc ?? '';
};

const sidesOf = (r: ApiRankingRow) => [
  { id: r.player1_id, model: r.player1_model, country: r.p1_country_model?.name },
  { id: r.player2_id, model: r.player2_model, country: r.p2_country_model?.name },
];

const syncTable = async ({ db, client }: Context, ranking: number, categories: Record<number, string>) => {
  const res = await client.get<ApiPublication[]>(publicationsPath(ranking), PUBLICATION_REFRESH);
  const pub = res?.data[0];
  if (!pub) return null;
  const rows = (
    await pool(Object.entries(categories), async ([cat, ev]) => {
      const fetchPage = (level: number, page: number) =>
        client.get<ApiRankingTable>(
          rankingTablePath(ranking, Number(cat), pub.id, DOUBLES.has(ev), page, PAGE_SIZES[level]),
          FOREVER,
          level ? SPLIT_RETRIES : undefined,
        );
      const rowsOf = async (level: number, page: number, got?: Cached<ApiRankingTable> | null) => {
        const table = got === undefined ? await fetchPage(level, page) : got;
        if (table) return table.data.results.data;
        const size = PAGE_SIZES[level] ?? 1;
        const finer = PAGE_SIZES[level + 1];
        if (!finer) return [];
        const ratio = size / finer;
        const parts = await pool(
          Array.from({ length: ratio }, (_, i) => (page - 1) * ratio + i + 1),
          (p): Promise<ApiRankingRow[]> => rowsOf(level + 1, p),
        );
        return parts.flat();
      };
      const first = await fetchPage(0, 1);
      const last = first?.data.results.last_page ?? 1;
      const pages = await pool(
        Array.from({ length: last }, (_, i) => i + 1),
        (page) => rowsOf(0, page, page === 1 ? first : undefined),
      );
      return pages.flat();
    })
  ).flat();

  const insert = db.prepare(
    'INSERT OR REPLACE INTO rankings (ranking, publication, category, player1, player2, rank, rank_previous, points, tournaments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertPlayer = db.prepare('INSERT OR REPLACE INTO ranking_players (id, name, cc, photo) VALUES (?, ?, ?, ?)');
  tx(db, () => {
    db.prepare('DELETE FROM rankings WHERE ranking = ?').run(ranking);
    for (const r of rows) {
      for (const { id, model, country } of sidesOf(r))
        if (id && model)
          insertPlayer.run(
            String(id),
            plainName(model.name_display_bold),
            countryOf(country),
            photoOf(model.avatar?.url_cloudinary),
          );
      insert.run(
        ranking,
        pub.id,
        r.ranking_category_id,
        String(r.player1_id),
        r.player2_id ? String(r.player2_id) : '',
        r.rank,
        r.rank_previous,
        Number.parseFloat(r.points) || 0,
        r.tournaments ?? null,
      );
    }
    db.prepare('INSERT OR REPLACE INTO publications (ranking, id, date, week) VALUES (?, ?, ?, ?)').run(
      ranking,
      pub.id,
      pub.date.slice(0, 10),
      `${pub.year}-${String(pub.week).padStart(2, '0')}`,
    );
  });
  console.log(`rankings ${ranking}: publication ${pub.id} (${pub.date.slice(0, 10)}) · ${rows.length} rows`);
  return pub.id;
};

export const weeklyHistory = async (
  client: Client,
  id: string,
  history: readonly ApiHistoryRow[],
  currentYear: number,
  publication: number,
) => {
  const known = Math.min(...history.map((h) => Number(h.date?.slice(0, 4)) || currentYear));
  const rows: ApiWeeklyRow[] = [];
  let empty = 0;
  let complete = true;
  for (let year = currentYear; year >= WEEKLY_FLOOR && (year >= known || empty < WEEKLY_GAP); year--) {
    const path = weeklyPath(id, year, year === currentYear ? publication : undefined);
    const res = await client.get<ApiWeekly>(path, FOREVER);
    if (res) client.prune(weeklyPrefix(id, year), path);
    else complete = false;
    const data = res?.data.data ?? [];
    empty = data.length ? 0 : empty + 1;
    rows.push(...data);
  }
  return { rows, complete };
};

const syncNames = async ({ db, client }: Context) => {
  const lead = all<{ player1: string }>(db, 'SELECT player1 FROM rankings ORDER BY ranking, rank LIMIT 1')[0];
  if (!lead) return;
  const listPath = rankingsListPath(lead.player1);
  const res = await client.get<ApiRankingInfo[]>(listPath, LIST_REFRESH);
  if (!res) return;
  client.prune(rankingsListPrefix, listPath);
  const update = db.prepare('UPDATE publications SET name = ? WHERE ranking = ?');
  for (const r of res.data) update.run(r.name, r.id);
};

export const syncRankings = async (ctx: Context) => {
  const { db, client } = ctx;
  unmapped.clear();
  const world = await syncTable(ctx, WORLD, WORLD_CATEGORIES);
  await syncTable(ctx, RACE, RACE_CATEGORIES);
  await syncNames(ctx);
  for (const [name, n] of unmapped) console.warn(`  ! unmapped ranking country "${name}" (${n})`);
  if (!world) return;

  const ids = all<{ id: string }>(
    db,
    `SELECT p.id FROM players p WHERE EXISTS (
       SELECT 1 FROM rankings r WHERE r.ranking = ? AND (r.player1 = p.id OR r.player2 = p.id))`,
    WORLD,
  ).map((r) => r.id);

  const key = `${world}:${ctx.currentYear}`;
  const state = readState<HistoryState | null>(db, HISTORY_STATE, null);
  const complete = new Set(state?.key === key ? state.done : []);
  const pending = ids.filter((id) => !complete.has(id));
  const todo = pending.slice(0, HISTORY_PER_RUN);

  let done = 0;
  await pool(todo, async (id) => {
    const path = historyPath(id, world);
    const res = await client.get<ApiHistory>(path, FOREVER);
    client.prune(historyPrefix(id), path);
    const weekly = res?.data.data.length
      ? await weeklyHistory(client, id, res.data.data, ctx.currentYear, world)
      : { complete: true };
    if (res && weekly.complete) complete.add(id);
    if (++done % 500 === 0) console.log(`  ranking history ${done}/${todo.length}`);
  });
  const finished = ids.filter((id) => complete.has(id));
  writeState(db, HISTORY_STATE, { key, done: finished } satisfies HistoryState);
  console.log(
    `ranking history: ${ids.length} ranked players · ${todo.length} checked · ${ids.length - finished.length} left for later runs`,
  );
};
