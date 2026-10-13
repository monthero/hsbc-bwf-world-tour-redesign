import { spawn } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { Connect, Plugin } from 'vite';

import { EventCode } from '../src/api/schemas.ts';
import {
  BulkRequest,
  canonicalOverride,
  ImageRequest,
  OverridesFile,
  PlayerOverride,
  sameOverride,
  setOverride,
  withField,
  type AdminPlayer,
  type BulkResult,
  type ImageResult,
  type SaveResult,
} from '../src/pages/admin/schema.ts';
import { createEquipment } from './equipment.ts';
import { HttpError, parseWith, readBody, readText, sendJson, writeAtomic } from './http.ts';
import { createImageStore } from './images.ts';

const WORLD = 2;
const FIRST_WORLD_CATEGORY = 6;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const EXPORT_ARGS = ['--disable-warning=ExperimentalWarning', 'scripts/sync/index.ts', '--only', 'export', '--offline'];
const PLAYERS_ROUTE = '/overrides/players';
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
  SELECT mp.player_id AS id, group_concat(DISTINCT m.event) AS events
  FROM match_players mp JOIN matches m ON m.id = mp.match_id
  GROUP BY mp.player_id
)
SELECT p.id, p.name, p.cc, p.photo, p.hero, p.last_played, p.bio, b.rank, b.category, b.cats, pl.events
FROM players p LEFT JOIN best b ON b.id = p.id LEFT JOIN played pl ON pl.id = p.id
`;

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
}

const eventOfCategory = (category: number) => EventCode.options[category - FIRST_WORLD_CATEGORY] ?? null;

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
  return `${JSON.stringify({ ...file, players }, null, 2)}\n`;
};

const tail = (text: string, lines = 12) => text.trim().split('\n').slice(-lines).join('\n');

const createAdmin = (root: string) => {
  const dbFile = path.join(root, 'data/bwf.sqlite');
  const overridesFile = path.join(root, 'data/overrides.json');
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

  const runExport = () =>
    new Promise<number>((resolve, reject) => {
      const started = Date.now();
      const child = spawn(process.execPath, EXPORT_ARGS, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
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
    const db = new DatabaseSync(dbFile, { readOnly: true });
    try {
      const rows = db.prepare(PLAYERS_SQL).all() as unknown as PlayerRow[];
      const players = rows.map((r): AdminPlayer => ({
        id: r.id,
        name: r.name,
        cc: r.cc,
        photo: r.photo,
        hero: r.hero,
        lastPlayed: r.last_played,
        rank: r.rank,
        rankEvent: r.category === null ? null : eventOfCategory(r.category),
        events: eventsOf(r),
        bio: r.bio ? (JSON.parse(r.bio) as AdminPlayer['bio']) : {},
        override: overrides[r.id] ?? null,
      }));
      return { players };
    } finally {
      db.close();
    }
  };

  const savePlayer = (id: string, body: unknown) => {
    const entry = canonicalOverride(parseWith(PlayerOverride, body));
    return serial(async (): Promise<SaveResult> => {
      await writeOverrides(setOverride(await readOverrides(), id, entry));
      return { entry, exportMs: await runExport() };
    });
  };

  const bulkUpdate = (body: unknown) => {
    const { ids, changes, source, asOf } = parseWith(BulkRequest, body);
    return serial(async (): Promise<BulkResult> => {
      let file = await readOverrides();
      const entries: BulkResult['entries'] = {};
      for (const id of new Set(ids)) {
        const before = canonicalOverride(file.players[id]);
        const after = changes.reduce<PlayerOverride | null>(
          (entry, c) => withField(entry, c.field, c.value, { source, asOf }),
          before,
        );
        if (sameOverride(before, after)) continue;
        entries[id] = after;
        file = setOverride(file, id, after);
      }
      const changed = Object.keys(entries).length;
      if (!changed) return { entries, changed, exportMs: 0 };
      await writeOverrides(file);
      return { entries, changed, exportMs: await runExport() };
    });
  };

  const fetchImage = async (body: unknown): Promise<ImageResult> => {
    const { id, kind, url, flip } = parseWith(ImageRequest, body);
    const [image] = await images.store(id, [kind], url ?? null, flip);
    if (!image) throw new HttpError(500, 'Image was not stored');
    return image;
  };

  const equipment = createEquipment({ dbFile, dataDir: path.join(root, 'data'), serial });

  const route = async (req: IncomingMessage, res: ServerResponse) => {
    const url = (req.url ?? '/').split('?')[0] ?? '/';
    const method = req.method ?? 'GET';
    if (method !== 'GET' && !isLocalRequest(req)) throw new HttpError(403, 'Admin API is local only');
    if (method === 'GET' && url === '/players') return sendJson(res, 200, await listPlayers());
    if (method === 'GET' && url === '/overrides') return sendJson(res, 200, await readOverrides());
    const player = PLAYER_ROUTE.exec(url)?.[1];
    if (method === 'PUT' && player) return sendJson(res, 200, await savePlayer(player, await readBody(req)));
    if (method === 'PATCH' && url === PLAYERS_ROUTE) return sendJson(res, 200, await bulkUpdate(await readBody(req)));
    if (method === 'POST' && url === '/images') return sendJson(res, 200, await fetchImage(await readBody(req)));
    const catalog = await equipment(method, req.url ?? '/', req);
    if (catalog !== undefined) return sendJson(res, 200, catalog);
    throw new HttpError(404, `No admin route for ${method} ${url}`);
  };

  const handler: Connect.NextHandleFunction = (req, res) => {
    route(req, res).catch((e: unknown) => {
      const status = e instanceof HttpError ? e.status : 500;
      sendJson(res, status, { error: e instanceof Error ? e.message : String(e) });
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
