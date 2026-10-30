import { spawn } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

import type { Connect, Plugin } from 'vite';

import { WORLD, WORLD_CATEGORIES } from '../scripts/sync/bwf.ts';
import { withDb } from '../scripts/sync/db.ts';
import { equipmentIssues, itemsById, readCatalog } from '../scripts/sync/equipment.ts';
import { prettyJson } from '../scripts/sync/util.ts';
import { EventCode } from '../src/api/schemas.ts';
import {
  BulkRequest,
  ImportRequest,
  canonicalOverride,
  ImageRequest,
  OverridesFile,
  PlayerOverride,
  sameOverride,
  setOverride,
  withField,
  type AdminPartner,
  type AdminPlayer,
  type BulkResult,
  type ImportRow,
  type ImageResult,
  type SaveResult,
} from '../src/pages/admin/schema.ts';
import { createEquipment } from './equipment.ts';
import { errorMessage, HttpError, parseWith, readBody, readText, sendJson, writeAtomic } from './http.ts';
import { createImageStore } from './images.ts';
import { retirementNews } from './retirement.ts';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const EXPORT_ARGS = ['--disable-warning=ExperimentalWarning', 'scripts/sync/index.ts', '--only', 'export', '--offline'];
const PLAYERS_ROUTE = '/overrides/players';
const IMPORT_ROUTE = '/overrides/import';
const PLAYER_ROUTE = new RegExp(`^${PLAYERS_ROUTE}/(\\d+)$`);

const PLAYERS_SQL = `
WITH ranks AS (
  SELECT player1 AS id, category, rank FROM rankings WHERE ranking = ${WORLD}
  UNION ALL
  SELECT player2, category, rank FROM rankings WHERE ranking = ${WORLD} AND player2 <> ''
),
best AS (
  SELECT id, min(rank) AS rank, category, group_concat(DISTINCT category) AS cats FROM ranks GROUP BY id
),
played AS (
  SELECT mp.player_id AS id, group_concat(DISTINCT m.event) AS events, m.edition, max(m.day || m.time) AS at
  FROM match_players mp JOIN matches m ON m.id = mp.match_id
  GROUP BY mp.player_id
)
SELECT p.id, p.name, p.cc, p.photo, p.hero, p.last_played, p.bio, b.rank, b.category, b.cats, pl.events,
  e.code AS last_code, e.slug AS last_slug, s.name AS last_name, e.season AS last_year
FROM players p LEFT JOIN best b ON b.id = p.id LEFT JOIN played pl ON pl.id = p.id
LEFT JOIN editions e ON e.code = pl.edition LEFT JOIN series s ON s.id = e.series_id
`;

const PARTNERS_SQL = `
WITH pairs AS (
  SELECT a.player_id AS id, b.player_id AS partner, m.event, m.day || m.time AS at
  FROM match_players a
  JOIN match_players b ON b.match_id = a.match_id AND b.team = a.team AND b.pos <> a.pos
  JOIN matches m ON m.id = a.match_id
  WHERE m.event IN ('MD', 'WD', 'XD')
)
SELECT id, event, partner, count(*) AS matches, max(at) AS at FROM pairs GROUP BY id, event, partner ORDER BY at DESC
`;

interface PartnerRow {
  id: string;
  event: string;
  partner: string;
  matches: number;
  at: string;
}

const partnersOf = (rows: readonly PartnerRow[]) => {
  const out = new Map<string, AdminPartner[]>();
  for (const r of rows) {
    const event = EventCode.safeParse(r.event);
    if (!event.success) continue;
    const list = out.get(r.id) ?? [];
    list.push({ id: r.partner, event: event.data, matches: r.matches, last: r.at.slice(0, 10) });
    out.set(r.id, list);
  }
  return out;
};

const NO_PARTNERS: AdminPartner[] = [];

interface PlayerRow {
  id: string;
  name: string;
  cc: string;
  photo: string | null;
  hero: string | null;
  last_played: string;
  bio: string | null;
  rank: number | null;
  category: number | null;
  cats: string | null;
  events: string | null;
  last_code: string | null;
  last_slug: string | null;
  last_name: string | null;
  last_year: number | null;
}

const lastTournamentOf = (r: PlayerRow): AdminPlayer['lastTournament'] =>
  r.last_code && r.last_slug && r.last_name && r.last_year
    ? { code: r.last_code, slug: r.last_slug, name: r.last_name, year: r.last_year }
    : null;

const NO_NEWS: AdminPlayer['retirementNews'] = [];

const eventOfCategory = (category: number) => WORLD_CATEGORIES[category] ?? null;

const eventsOf = (row: PlayerRow) => {
  const played = new Set(row.events?.split(',') ?? []);
  for (const c of row.cats?.split(',') ?? []) played.add(eventOfCategory(Number(c)) ?? '');
  return EventCode.options.filter((e) => played.has(e));
};

const hostOf = (value: string) => {
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).hostname;
  } catch {
    return '';
  }
};

const isLocalRequest = (req: IncomingMessage) => {
  const origin = req.headers.origin;
  return LOCAL_HOSTS.has(hostOf(req.headers.host ?? '')) && (!origin || LOCAL_HOSTS.has(hostOf(origin)));
};

const byId = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });

const serialize = (file: OverridesFile) => {
  const players = Object.fromEntries(
    Object.keys(file.players)
      .sort(byId)
      .flatMap((id) => {
        const entry = canonicalOverride(file.players[id]);
        return entry ? [[id, entry]] : [];
      }),
  );
  return prettyJson({ ...file, players });
};

const tail = (text: string, lines = 12) => text.trim().split('\n').slice(-lines).join('\n');

const createAdmin = (root: string) => {
  const dataDir = path.join(root, 'data');
  const dbFile = path.join(dataDir, 'bwf.sqlite');
  const overridesFile = path.join(dataDir, 'overrides.json');
  const images = createImageStore(root);
  let queue: Promise<unknown> = Promise.resolve();

  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };

  const readOverrides = async (): Promise<OverridesFile> =>
    OverridesFile.parse(JSON.parse(await readText(overridesFile, () => '{}')));

  const writeOverrides = (file: OverridesFile) => writeAtomic(overridesFile, serialize(file));

  const checkEquipment = (entries: Iterable<PlayerOverride | null>) => {
    const items = itemsById(readCatalog(dataDir).items);
    const issues = [...entries].flatMap((e) => equipmentIssues(e?.bio, items));
    if (issues.length) throw new HttpError(400, [...new Set(issues)].join('\n'));
  };

  const runExport = (players?: readonly string[]) =>
    new Promise<number>((resolve, reject) => {
      const started = Date.now();
      const args = players ? [...EXPORT_ARGS, '--players', players.join(',')] : EXPORT_ARGS;
      const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      const collect = (chunk: Buffer) => {
        output += chunk.toString('utf8');
      };
      child.stdout.on('data', collect);
      child.stderr.on('data', collect);
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve(Date.now() - started);
        else reject(new HttpError(500, `Export failed (exit ${code}):\n${tail(output)}`));
      });
    });

  const listPlayers = async () => {
    const overrides = (await readOverrides()).players;
    return withDb(dbFile, true, (db) => {
      const rows = db.prepare(PLAYERS_SQL).all() as unknown as PlayerRow[];
      const news = retirementNews(db);
      const partners = partnersOf(db.prepare(PARTNERS_SQL).all() as unknown as PartnerRow[]);
      const players = rows.map((r): AdminPlayer => ({
        id: r.id,
        name: r.name,
        cc: r.cc,
        photo: r.photo,
        hero: r.hero,
        lastPlayed: r.last_played,
        lastTournament: lastTournamentOf(r),
        retirementNews: news.get(r.id) ?? NO_NEWS,
        rank: r.rank,
        rankEvent: r.category === null ? null : eventOfCategory(r.category),
        events: eventsOf(r),
        partners: partners.get(r.id) ?? NO_PARTNERS,
        bio: r.bio ? (JSON.parse(r.bio) as AdminPlayer['bio']) : {},
        override: overrides[r.id] ?? null,
      }));
      return { players };
    });
  };

  const savePlayer = (id: string, body: unknown) => {
    const entry = canonicalOverride(parseWith(PlayerOverride, body));
    return serial(async (): Promise<SaveResult> => {
      checkEquipment([entry]);
      const file = await readOverrides();
      const renamed = canonicalOverride(file.players[id])?.name !== entry?.name;
      await writeOverrides(setOverride(file, id, entry));
      return { entry, exportMs: await runExport(renamed ? undefined : [id]) };
    });
  };

  const applyRows = (rows: readonly ImportRow[]) =>
    serial(async (): Promise<BulkResult> => {
      let file = await readOverrides();
      const entries: BulkResult['entries'] = {};
      for (const { id, changes } of rows) {
        const before = canonicalOverride(file.players[id]);
        const after = changes.reduce<PlayerOverride | null>((entry, c) => withField(entry, c.field, c.value), before);
        if (sameOverride(before, after)) continue;
        entries[id] = after;
        file = setOverride(file, id, after);
      }
      const changed = Object.keys(entries).length;
      if (!changed) return { entries, changed, exportMs: 0 };
      checkEquipment(Object.values(entries));
      await writeOverrides(file);
      return { entries, changed, exportMs: await runExport(Object.keys(entries)) };
    });

  const bulkUpdate = (body: unknown) => {
    const { ids, changes } = parseWith(BulkRequest, body);
    return applyRows([...new Set(ids)].map((id) => ({ id, changes })));
  };

  const importRows = (body: unknown) => applyRows(parseWith(ImportRequest, body).rows);

  const fetchImage = async (body: unknown): Promise<ImageResult> => {
    const { id, kind, url, flip } = parseWith(ImageRequest, body);
    const [image] = await images.store(id, [kind], url ?? null, flip);
    if (!image) throw new HttpError(500, 'Image was not stored');
    return image;
  };

  const equipment = createEquipment({ dbFile, dataDir, serial });

  const route = async (req: IncomingMessage, res: ServerResponse) => {
    const url = (req.url ?? '/').split('?')[0] ?? '/';
    const method = req.method ?? 'GET';
    if (method !== 'GET' && !isLocalRequest(req)) throw new HttpError(403, 'Admin API is local only');
    if (method === 'GET' && url === '/players') return sendJson(res, 200, await listPlayers());
    if (method === 'GET' && url === '/overrides') return sendJson(res, 200, await readOverrides());
    const player = PLAYER_ROUTE.exec(url)?.[1];
    if (method === 'PUT' && player) return sendJson(res, 200, await savePlayer(player, await readBody(req)));
    if (method === 'PATCH' && url === PLAYERS_ROUTE) return sendJson(res, 200, await bulkUpdate(await readBody(req)));
    if (method === 'POST' && url === IMPORT_ROUTE) return sendJson(res, 200, await importRows(await readBody(req)));
    if (method === 'POST' && url === '/images') return sendJson(res, 200, await fetchImage(await readBody(req)));
    const catalog = await equipment(method, req.url ?? '/', req);
    if (catalog !== undefined) return sendJson(res, 200, catalog);
    throw new HttpError(404, `No admin route for ${method} ${url}`);
  };

  const handler: Connect.NextHandleFunction = (req, res) => {
    route(req, res).catch((e: unknown) => {
      const status = e instanceof HttpError ? e.status : 500;
      sendJson(res, status, { error: errorMessage(e) });
    });
  };
  return handler;
};

export const adminApi = (root: string): Plugin => ({
  name: 'admin-api',
  apply: 'serve',
  configureServer: (server) => {
    server.middlewares.use('/admin-api', createAdmin(root));
  },
});
