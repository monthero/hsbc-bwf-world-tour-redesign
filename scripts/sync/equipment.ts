import fs from 'node:fs'
import path from 'node:path'
import type { DatabaseSync } from 'node:sqlite'

export interface BrandItem {
  id: string
  name: string
  aliases: string[]
}

export interface EquipmentItem {
  kind: string
  brand: string
  model: string
}

export interface EquipmentRow {
  id: number | null
  kind: string
  brandId: string
  brand: string
  model: string
  name: string
}

export interface Catalog {
  brands: BrandItem[]
  items: EquipmentItem[]
}

export const BRANDS_FILE = 'brands.json'
export const EQUIPMENT_FILE = 'equipment.json'

const CATALOG_TABLES = `
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  model TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(kind, brand_id, model)
);
`

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()

export const compactKey = (s: string) => fold(s).replace(/[^a-z0-9]/g, '')

export const brandId = (name: string) =>
  fold(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const brandKeys = (b: Pick<BrandItem, 'name' | 'aliases'>) => [b.name, ...b.aliases].map(compactKey)

const byText = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })

const compareItems = (a: EquipmentItem, b: EquipmentItem) =>
  byText(a.kind, b.kind) || byText(a.brand, b.brand) || byText(a.model, b.model)

export const itemKey = (e: EquipmentItem) => [e.kind, e.brand, e.model].map(fold).join('\u0000')

const exactKey = (e: EquipmentItem) => [e.kind, e.brand, e.model].join('\u0000')

const pickItem = ({ kind, brand, model }: EquipmentItem): EquipmentItem => ({ kind, brand, model })

const pickBrand = ({ id, name, aliases }: BrandItem): BrandItem => ({ id, name, aliases: aliases ?? [] })

const readJson = <T>(file: string): T[] =>
  fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T[]) : []

export const readCatalog = (dir: string): Catalog => ({
  brands: readJson<BrandItem>(path.join(dir, BRANDS_FILE)).map(pickBrand),
  items: readJson<EquipmentItem>(path.join(dir, EQUIPMENT_FILE)).map(pickItem),
})

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

export const serializeBrands = (brands: readonly BrandItem[]) =>
  json([...brands].map(pickBrand).sort((a, b) => byText(a.name, b.name)))

export const serializeItems = (items: readonly EquipmentItem[]) => json([...items].map(pickItem).sort(compareItems))

const nameOf = (brand: string, e: EquipmentItem) => `${brand} ${e.model}`

export const toRows = ({ brands, items }: Catalog): EquipmentRow[] => {
  const names = new Map(brands.map((b) => [b.id, b.name]))
  return items
    .flatMap((e): EquipmentRow[] => {
      const brand = names.get(e.brand)
      if (!brand) return []
      return [{ id: null, kind: e.kind, brandId: e.brand, brand, model: e.model, name: nameOf(brand, e) }]
    })
    .sort((a, b) => byText(a.name, b.name))
}

const dropLegacy = (db: DatabaseSync) => {
  const cols = db.prepare('PRAGMA table_info(equipment)').all() as { name: string }[]
  if (cols.some((c) => c.name === 'brand' || c.name === 'family')) db.exec('DROP TABLE equipment')
}

export const seedCatalog = (db: DatabaseSync, catalog: Catalog) => {
  dropLegacy(db)
  db.exec(CATALOG_TABLES)
  const rows = toRows(catalog)
  const keep = new Set(rows.map((r) => exactKey({ ...r, brand: r.brandId })))
  const brandIds = new Set(catalog.brands.map((b) => b.id))
  const upsertBrand = db.prepare(
    'INSERT INTO brands (id, name, aliases) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, aliases = excluded.aliases',
  )
  const upsertItem = db.prepare(
    'INSERT INTO equipment (kind, brand_id, model, name) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(kind, brand_id, model) DO UPDATE SET name = excluded.name',
  )
  const staleItems = (
    db.prepare('SELECT id, kind, brand_id AS brand, model FROM equipment').all() as unknown as (EquipmentItem & {
      id: number
    })[]
  ).filter((r) => !keep.has(exactKey(r)))
  const staleBrands = (db.prepare('SELECT id FROM brands').all() as { id: string }[]).filter((b) => !brandIds.has(b.id))
  const removeItem = db.prepare('DELETE FROM equipment WHERE id = ?')
  const removeBrand = db.prepare('DELETE FROM brands WHERE id = ?')
  db.exec('BEGIN')
  try {
    for (const b of catalog.brands) upsertBrand.run(b.id, b.name, JSON.stringify(b.aliases))
    for (const r of rows) upsertItem.run(r.kind, r.brandId, r.model, r.name)
    for (const r of staleItems) removeItem.run(r.id)
    for (const b of staleBrands) removeBrand.run(b.id)
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

export const queryCatalog = (db: DatabaseSync, kind: string) => ({
  rows: (
    db
      .prepare(
        'SELECT e.id, e.kind, e.brand_id AS brandId, b.name AS brand, e.model, e.name ' +
          'FROM equipment e JOIN brands b ON b.id = e.brand_id WHERE e.kind = ?',
      )
      .all(kind) as unknown as EquipmentRow[]
  ).sort((a, b) => byText(a.name, b.name)),
  brands: (
    db.prepare('SELECT id, name, aliases FROM brands ORDER BY name').all() as {
      id: string
      name: string
      aliases: string
    }[]
  ).map((b): BrandItem => ({ ...b, aliases: JSON.parse(b.aliases) as string[] })),
})
