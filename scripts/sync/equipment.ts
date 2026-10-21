import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

import { EquipmentKind, type BioValues, type PlayerOverride } from '../../src/pages/admin/schema.ts';
import { collapseSpaces, fold, prettyJson, readJsonFile } from './util.ts';

export interface BrandItem {
  id: string;
  name: string;
  aliases: string[];
}

export interface EquipmentItem {
  id: string;
  kind: string;
  brand: string;
  model: string;
}

export interface EquipmentRow extends Omit<EquipmentItem, 'brand'> {
  brandId: string;
  brand: string;
  name: string;
}

export interface Catalog {
  brands: BrandItem[];
  items: EquipmentItem[];
}

export const BRANDS_FILE = 'brands.json';
export const EQUIPMENT_FILE = 'equipment.json';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const KINDS: ReadonlySet<string> = new Set(EquipmentKind.options);

const CATALOG_TABLES = `
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  model TEXT NOT NULL,
  name TEXT NOT NULL
);
`;

const foldKey = (s: string) => collapseSpaces(fold(s));

export const compactKey = (s: string) => foldKey(s).replace(/[^a-z0-9]/g, '');

export const brandId = (name: string) =>
  foldKey(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const brandKeys = (b: Pick<BrandItem, 'name' | 'aliases'>) => [b.name, ...b.aliases].map(compactKey);

export const newItemId = () => randomUUID();

const byText = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });

const compareItems = (a: EquipmentItem, b: EquipmentItem) =>
  byText(a.kind, b.kind) || byText(a.brand, b.brand) || byText(a.model, b.model);

const compareRows = (a: EquipmentRow, b: EquipmentRow) => byText(a.name, b.name);

export const itemKey = (e: Pick<EquipmentItem, 'kind' | 'brand' | 'model'>) =>
  [e.kind, e.brand, compactKey(e.model)].join('\u0000');

const pickItem = ({ id, kind, brand, model }: EquipmentItem): EquipmentItem => ({ id, kind, brand, model });

const pickBrand = ({ id, name, aliases }: BrandItem): BrandItem => ({ id, name, aliases: aliases ?? [] });

export const readCatalog = (dir: string): Catalog => ({
  brands: readJsonFile<BrandItem[]>(path.join(dir, BRANDS_FILE), []).map(pickBrand),
  items: readJsonFile<EquipmentItem[]>(path.join(dir, EQUIPMENT_FILE), []).map(pickItem),
});

export const serializeBrands = (brands: readonly BrandItem[]) =>
  prettyJson([...brands].map(pickBrand).sort((a, b) => byText(a.name, b.name)));

export const serializeItems = (items: readonly EquipmentItem[]) =>
  prettyJson([...items].map(pickItem).sort(compareItems));

export const toRows = ({ brands, items }: Catalog): EquipmentRow[] => {
  const names = new Map(brands.map((b) => [b.id, b.name]));
  return items
    .flatMap(({ brand: id, ...e }): EquipmentRow[] => {
      const brand = names.get(id);
      return brand ? [{ ...e, brandId: id, brand, name: `${brand} ${e.model}` }] : [];
    })
    .sort(compareRows);
};

const catalogIssues = ({ brands, items }: Catalog) => {
  const brandIds = new Set(brands.map((b) => b.id));
  const ids = new Set<string>();
  const products = new Map<string, string>();
  const issues: string[] = [];
  for (const e of items) {
    const label = `${e.kind} ${e.brand} "${e.model}"`;
    if (!UUID_V4.test(e.id ?? '')) issues.push(`${label}: id "${e.id}" is not a UUIDv4`);
    else if (ids.has(e.id)) issues.push(`${label}: id ${e.id} is used twice`);
    ids.add(e.id);
    if (!KINDS.has(e.kind)) issues.push(`${label}: unknown kind`);
    if (!brandIds.has(e.brand)) issues.push(`${label}: unknown brand`);
    const twin = products.get(itemKey(e));
    if (twin) issues.push(`${label}: same product as ${twin}`);
    else products.set(itemKey(e), e.id);
  }
  return issues;
};

export const itemsById = (items: readonly EquipmentItem[]) => new Map(items.map((e) => [e.id, e]));

export const equipmentIssues = (bio: BioValues | undefined, byId: ReadonlyMap<string, EquipmentItem>) =>
  EquipmentKind.options.flatMap((kind) => {
    const value = bio?.[kind];
    if (value === undefined || byId.get(String(value))?.kind === kind) return [];
    return [`${kind} "${value}" is not a ${kind} in the catalog`];
  });

export const dataIssues = (catalog: Catalog, overrides: Record<string, PlayerOverride>) => {
  const byId = itemsById(catalog.items);
  return [
    ...catalogIssues(catalog),
    ...Object.entries(overrides).flatMap(([id, o]) => equipmentIssues(o.bio, byId).map((m) => `player ${id}: ${m}`)),
  ];
};

export const resolveEquipment = <T extends Record<string, unknown>>(
  bio: T | undefined,
  names: ReadonlyMap<string, string>,
) =>
  bio && {
    ...bio,
    ...Object.fromEntries(
      EquipmentKind.options.flatMap((kind) => {
        const name = names.get(String(bio[kind]));
        return name ? [[kind, name]] : [];
      }),
    ),
  };

const dropLegacy = (db: DatabaseSync) => {
  const cols = db.prepare('PRAGMA table_info(equipment)').all() as { name: string; type: string }[];
  if (cols.some((c) => c.name === 'id' && c.type !== 'TEXT')) db.exec('DROP TABLE equipment');
};

export const seedCatalog = (db: DatabaseSync, catalog: Catalog) => {
  dropLegacy(db);
  db.exec(CATALOG_TABLES);
  const rows = toRows(catalog);
  const keep = new Set(rows.map((r) => r.id));
  const brandIds = new Set(catalog.brands.map((b) => b.id));
  const upsertBrand = db.prepare(
    'INSERT INTO brands (id, name, aliases) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, aliases = excluded.aliases',
  );
  const upsertItem = db.prepare(
    'INSERT INTO equipment (id, kind, brand_id, model, name) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, brand_id = excluded.brand_id, model = excluded.model, name = excluded.name',
  );
  const staleItems = (db.prepare('SELECT id FROM equipment').all() as { id: string }[]).filter((r) => !keep.has(r.id));
  const staleBrands = (db.prepare('SELECT id FROM brands').all() as { id: string }[]).filter(
    (b) => !brandIds.has(b.id),
  );
  const removeItem = db.prepare('DELETE FROM equipment WHERE id = ?');
  const removeBrand = db.prepare('DELETE FROM brands WHERE id = ?');
  db.exec('BEGIN');
  try {
    for (const b of catalog.brands) upsertBrand.run(b.id, b.name, JSON.stringify(b.aliases));
    for (const r of rows) upsertItem.run(r.id, r.kind, r.brandId, r.model, r.name);
    for (const r of staleItems) removeItem.run(r.id);
    for (const b of staleBrands) removeBrand.run(b.id);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
};

export const queryCatalog = (db: DatabaseSync) => ({
  rows: (
    db
      .prepare(
        'SELECT e.id, e.kind, e.brand_id AS brandId, b.name AS brand, e.model, e.name ' +
          'FROM equipment e JOIN brands b ON b.id = e.brand_id',
      )
      .all() as unknown as EquipmentRow[]
  ).sort(compareRows),
  brands: (
    db.prepare('SELECT id, name, aliases FROM brands ORDER BY name').all() as {
      id: string;
      name: string;
      aliases: string;
    }[]
  ).map((b): BrandItem => ({ ...b, aliases: JSON.parse(b.aliases) as string[] })),
});
