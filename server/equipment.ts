import fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import path from 'node:path';

import { withDb, type Db } from '../scripts/sync/db.ts';
import {
  BRANDS_FILE,
  brandId,
  brandKeys,
  compactKey,
  EQUIPMENT_FILE,
  itemKey,
  newItemId,
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

  const fromJson = (catalog = readCatalog(ctx.dataDir)): EquipmentList => ({
    rows: toRows(catalog) as EquipmentRow[],
    brands: catalog.brands,
  });

  let seededAt = '';

  const reseed = (db: Db, catalog = readCatalog(ctx.dataDir)) => {
    seedCatalog(db, catalog);
    seededAt = mtime();
  };

  const list = (): EquipmentList => {
    if (!fs.existsSync(ctx.dbFile)) return fromJson();
    try {
      if (mtime() !== seededAt) withDb(ctx.dbFile, false, (db) => reseed(db));
      const found = withDb(ctx.dbFile, true, (db) => queryCatalog(db)) as EquipmentList;
      return found.rows.length ? found : fromJson();
    } catch {
      return fromJson();
    }
  };

  const save = async (next: Catalog) => {
    const [brandsFile, itemsFile] = files as [string, string];
    await writeAtomic(brandsFile, serializeBrands(next.brands));
    await writeAtomic(itemsFile, serializeItems(next.items));
    if (!fs.existsSync(ctx.dbFile)) return fromJson(next);
    return withDb(ctx.dbFile, false, (db) => {
      reseed(db, next);
      return queryCatalog(db) as EquipmentList;
    });
  };

  const addItem = (body: unknown) => {
    const input = parseWith(EquipmentInput, body);
    return ctx.serial(async (): Promise<EquipmentAdded> => {
      const catalog = readCatalog(ctx.dataDir);
      if (!catalog.brands.some((b) => b.id === input.brandId))
        throw new HttpError(400, `Unknown brand "${input.brandId}", add the brand first`);
      const item = { id: newItemId(), kind: input.kind, brand: input.brandId, model: input.model };
      const existing = catalog.items.find((e) => itemKey(e) === itemKey(item));
      const next = existing ? catalog : { ...catalog, items: [...catalog.items, item] };
      const saved = await save(next);
      const id = (existing ?? item).id;
      const row = saved.rows.find((r) => r.id === id);
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
      await save(next);
      return { brands: next.brands, brand, created: true };
    });
  };

  return async (method: string, url: string, req: IncomingMessage): Promise<unknown> => {
    const pathname = url.split('?')[0];
    if (method === 'GET' && pathname === '/equipment') return list();
    if (method === 'POST' && pathname === '/equipment') return addItem(await readBody(req));
    if (method === 'POST' && pathname === '/brands') return addBrand(await readBody(req));
    return undefined;
  };
};
