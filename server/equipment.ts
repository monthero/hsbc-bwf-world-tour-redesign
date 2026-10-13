import fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
  BRANDS_FILE,
  brandId,
  brandKeys,
  compactKey,
  EQUIPMENT_FILE,
  itemKey,
  queryCatalog,
  readCatalog,
  seedCatalog,
  serializeBrands,
  serializeItems,
  toRows,
  type Catalog,
} from '../scripts/sync/equipment.ts';
import {
  BrandInput,
  EquipmentInput,
  EquipmentKind,
  type BrandAdded,
  type EquipmentAdded,
  type EquipmentList,
  type EquipmentRow,
} from '../src/pages/admin/schema.ts';
import { HttpError, parseWith, readBody, writeAtomic } from './http.ts';

interface EquipmentContext {
  dbFile: string;
  dataDir: string;
  serial: <T>(task: () => Promise<T>) => Promise<T>;
}

export const createEquipment = (ctx: EquipmentContext) => {
  const files = [path.join(ctx.dataDir, BRANDS_FILE), path.join(ctx.dataDir, EQUIPMENT_FILE)];
  const mtime = () => files.map((f) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0)).join(':');

  const fromJson = (kind: EquipmentKind, catalog = readCatalog(ctx.dataDir)): EquipmentList => ({
    rows: toRows(catalog).filter((r) => r.kind === kind) as EquipmentRow[],
    brands: catalog.brands,
  });

  const withDb = <T>(readOnly: boolean, run: (db: DatabaseSync) => T) => {
    const db = new DatabaseSync(ctx.dbFile, { readOnly });
    try {
      return run(db);
    } finally {
      db.close();
    }
  };

  let seededAt = '';

  const reseed = (db: DatabaseSync, catalog = readCatalog(ctx.dataDir)) => {
    seedCatalog(db, catalog);
    seededAt = mtime();
  };

  const list = (kind: EquipmentKind): EquipmentList => {
    if (!fs.existsSync(ctx.dbFile)) return fromJson(kind);
    try {
      if (mtime() !== seededAt) withDb(false, (db) => reseed(db));
      const found = withDb(true, (db) => queryCatalog(db, kind)) as EquipmentList;
      return found.rows.length ? found : fromJson(kind);
    } catch {
      return fromJson(kind);
    }
  };

  const save = async (next: Catalog, kind: EquipmentKind) => {
    const [brandsFile, itemsFile] = files as [string, string];
    await writeAtomic(brandsFile, serializeBrands(next.brands));
    await writeAtomic(itemsFile, serializeItems(next.items));
    if (!fs.existsSync(ctx.dbFile)) return fromJson(kind, next);
    return withDb(false, (db) => {
      reseed(db, next);
      return queryCatalog(db, kind) as EquipmentList;
    });
  };

  const addItem = (body: unknown) => {
    const input = parseWith(EquipmentInput, body);
    return ctx.serial(async (): Promise<EquipmentAdded> => {
      const catalog = readCatalog(ctx.dataDir);
      if (!catalog.brands.some((b) => b.id === input.brandId))
        throw new HttpError(400, `Unknown brand "${input.brandId}", add the brand first`);
      const item = { kind: input.kind, brand: input.brandId, model: input.model };
      const existing = catalog.items.find((e) => itemKey(e) === itemKey(item));
      const next = existing ? catalog : { ...catalog, items: [...catalog.items, item] };
      const saved = await save(next, input.kind);
      const key = itemKey(existing ?? item);
      const row = saved.rows.find((r) => itemKey({ ...r, brand: r.brandId }) === key);
      if (!row) throw new Error('Catalog row missing after insert');
      return { ...saved, row, created: !existing };
    });
  };

  const addBrand = (body: unknown) => {
    const input = parseWith(BrandInput, body);
    return ctx.serial(async (): Promise<BrandAdded> => {
      const catalog = readCatalog(ctx.dataDir);
      const keys = new Set(brandKeys(input));
      const existing = catalog.brands.find((b) => brandKeys(b).some((k) => keys.has(k)));
      if (existing) return { brands: catalog.brands, brand: existing, created: false };
      const id = brandId(input.name);
      if (!compactKey(id)) throw new HttpError(400, 'Brand name needs letters or digits');
      const brand = { id, name: input.name, aliases: input.aliases };
      const next = { ...catalog, brands: [...catalog.brands, brand] };
      await save(next, 'racket');
      return { brands: next.brands, brand, created: true };
    });
  };

  return async (method: string, url: string, req: IncomingMessage): Promise<unknown> => {
    const [pathname, query = ''] = url.split('?');
    if (method === 'GET' && pathname === '/equipment')
      return list(parseWith(EquipmentKind, new URLSearchParams(query).get('kind') ?? 'racket'));
    if (method === 'POST' && pathname === '/equipment') return addItem(await readBody(req));
    if (method === 'POST' && pathname === '/brands') return addBrand(await readBody(req));
    return undefined;
  };
};
