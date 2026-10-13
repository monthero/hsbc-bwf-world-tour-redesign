import path from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { readCatalog, seedCatalog } from './equipment.ts';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS responses (
  path TEXT PRIMARY KEY,
  fetched_at INTEGER NOT NULL,
  body BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS editions (
  code TEXT PRIMARY KEY,
  tmt_id INTEGER NOT NULL,
  series_id TEXT NOT NULL REFERENCES series(id),
  season INTEGER NOT NULL,
  slug TEXT NOT NULL,
  level TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  venue TEXT,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  prize INTEGER NOT NULL,
  logo_version TEXT NOT NULL,
  header_version TEXT NOT NULL,
  cancelled INTEGER NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  bwf_series INTEGER,
  official_venue TEXT,
  etihad INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  edition TEXT NOT NULL REFERENCES editions(code),
  day TEXT NOT NULL,
  code TEXT,
  event TEXT NOT NULL,
  round TEXT NOT NULL,
  grp TEXT,
  time TEXT NOT NULL,
  time_utc TEXT,
  court INTEGER NOT NULL,
  status TEXT NOT NULL,
  winner INTEGER NOT NULL,
  note TEXT,
  duration INTEGER NOT NULL,
  games TEXT NOT NULL,
  seed1 INTEGER,
  seed2 INTEGER,
  location TEXT
);
CREATE INDEX IF NOT EXISTS matches_edition ON matches(edition, day);
CREATE TABLE IF NOT EXISTS match_players (
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team INTEGER NOT NULL,
  pos INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cc TEXT NOT NULL,
  PRIMARY KEY (match_id, team, pos)
);
CREATE INDEX IF NOT EXISTS match_players_player ON match_players(player_id);
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cc TEXT NOT NULL,
  photo TEXT,
  hero TEXT,
  slug TEXT,
  last_played TEXT NOT NULL,
  bio TEXT
);
CREATE TABLE IF NOT EXISTS rankings (
  ranking INTEGER NOT NULL,
  publication INTEGER NOT NULL,
  category INTEGER NOT NULL,
  player1 TEXT NOT NULL,
  player2 TEXT NOT NULL DEFAULT '',
  rank INTEGER NOT NULL,
  rank_previous INTEGER,
  points REAL NOT NULL,
  PRIMARY KEY (ranking, category, player1, player2)
);
CREATE TABLE IF NOT EXISTS publications (
  ranking INTEGER PRIMARY KEY,
  id INTEGER NOT NULL,
  date TEXT NOT NULL,
  week TEXT NOT NULL,
  name TEXT
);
CREATE TABLE IF NOT EXISTS ranking_players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cc TEXT NOT NULL,
  photo TEXT
);
CREATE TABLE IF NOT EXISTS news_raw (
  id INTEGER PRIMARY KEY,
  published INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,
  body BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY,
  month TEXT NOT NULL,
  published_at TEXT NOT NULL,
  item TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS news_month ON news(month, published_at);
CREATE TABLE IF NOT EXISTS news_tournaments (
  news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  PRIMARY KEY (news_id, code)
);
CREATE INDEX IF NOT EXISTS news_tournaments_code ON news_tournaments(code);
CREATE TABLE IF NOT EXISTS news_players (
  news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  PRIMARY KEY (news_id, player_id)
);
CREATE INDEX IF NOT EXISTS news_players_player ON news_players(player_id);
CREATE TABLE IF NOT EXISTS news_popular (
  rank INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS news_articles (
  id INTEGER PRIMARY KEY REFERENCES news(id) ON DELETE CASCADE,
  article TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

export type Db = DatabaseSync;
export type Row = Record<string, SQLInputValue>;

const COLUMNS: [table: string, column: string, type: string][] = [
  ['editions', 'bwf_series', 'INTEGER'],
  ['editions', 'official_venue', 'TEXT'],
  ['editions', 'etihad', 'INTEGER NOT NULL DEFAULT 0'],
  ['rankings', 'tournaments', 'INTEGER'],
  ['publications', 'name', 'TEXT'],
  ['matches', 'time_utc', 'TEXT'],
];

const migrate = (db: DatabaseSync) => {
  for (const [table, column, type] of COLUMNS) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
};

export const openDb = (file: string, dataDir = path.dirname(file)): Db => {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  migrate(db);
  seedCatalog(db, readCatalog(dataDir));
  return db;
};

export const tx = <T>(db: Db, fn: () => T): T => {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
};

export const all = <T>(db: Db, sql: string, ...params: SQLInputValue[]) => db.prepare(sql).all(...params) as T[];

export const exists = (db: Db, sql: string, ...params: SQLInputValue[]) => db.prepare(sql).get(...params) !== undefined;

export const readState = <T>(db: Db, key: string, fallback: T): T => {
  const row = db.prepare('SELECT value FROM sync_state WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? (JSON.parse(row.value) as T) : fallback;
};

export const writeState = (db: Db, key: string, value: unknown) =>
  db
    .prepare(
      'INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    )
    .run(key, JSON.stringify(value), Date.now());
