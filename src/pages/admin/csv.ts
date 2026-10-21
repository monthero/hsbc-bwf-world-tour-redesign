import { countryName, flagEmoji } from '~/utils/countries';
import { parseCsv, toCsv } from '~/utils/csv';
import { parsePlays } from '~/utils/format';

import { catalogId, nameOf, type CatalogNames } from './catalog';
import { bwfValue, displayName, effectiveValue, FIELD_BY_KEY, planBulk, type BulkChange } from './fields';
import {
  bioKeyOf,
  CSV_FIELDS,
  overrideValue,
  CSV_ID,
  decodeBio,
  type AdminPlayer,
  type BioFieldKey,
  type CsvColumn,
  type EquipmentRow,
  type ImportRow,
} from './schema';

export interface FieldImport {
  key: BioFieldKey;
  label: string;
  changes: BulkChange[];
}

export interface ImportPlan {
  fields: FieldImport[];
  rows: ImportRow[];
  players: number;
  unknown: number;
  duplicates: number;
  invalid: number;
  error: string | null;
}

const CSV_COLUMNS = Object.keys(CSV_FIELDS) as CsvColumn[];
const isCsvColumn = (name: string): name is CsvColumn => Object.hasOwn(CSV_FIELDS, name);

const emptyPlan = (error: string | null): ImportPlan => ({
  fields: [],
  rows: [],
  players: 0,
  unknown: 0,
  duplicates: 0,
  invalid: 0,
  error,
});

const nextValue = (player: AdminPlayer, key: BioFieldKey, change: BulkChange) => {
  const bioKey = bioKeyOf(key);
  const trusted = FIELD_BY_KEY.get(key)?.trustBwf !== false;
  return trusted && decodeBio(bioKey, bwfValue(player, key)) === decodeBio(bioKey, change.next) ? null : change.next;
};

const importValue = (key: BioFieldKey, value: string, catalog: readonly EquipmentRow[]) => {
  const kind = FIELD_BY_KEY.get(key)?.catalog;
  return kind ? catalogId(catalog, kind, value) : value;
};

export const planImport = (
  text: string,
  players: readonly AdminPlayer[],
  catalog: readonly EquipmentRow[],
): ImportPlan => {
  const [head = [], ...body] = parseCsv(text);
  const names = head.map((h) => h.trim().toLowerCase());
  const idAt = names.indexOf(CSV_ID);
  if (idAt < 0) return emptyPlan(`The file needs a ${CSV_ID} column`);
  const columns = names.flatMap((name, i) => (isCsvColumn(name) ? [{ at: i, key: CSV_FIELDS[name] }] : []));
  if (!columns.length) return emptyPlan(`No known columns. Use ${CSV_COLUMNS.join(', ')}`);

  const byId = new Map(players.map((p) => [p.id, p]));
  const changes = new Map<BioFieldKey, BulkChange[]>(columns.map((c) => [c.key, []]));
  const seen = new Set<string>();
  const plan = emptyPlan(null);
  for (const cells of body) {
    const id = cells[idAt]?.trim() ?? '';
    const player = byId.get(id);
    if (!player) {
      plan.unknown++;
      continue;
    }
    if (seen.has(id)) {
      plan.duplicates++;
      continue;
    }
    seen.add(id);
    const row: ImportRow = { id, changes: [] };
    for (const { at, key } of columns) {
      const cell = cells[at]?.trim();
      if (!cell) continue;
      const value = importValue(key, cell, catalog);
      if (value === undefined || decodeBio(bioKeyOf(key), value) === undefined) {
        plan.invalid++;
        continue;
      }
      const [change] = planBulk([player], key, value);
      if (!change) continue;
      changes.get(key)?.push(change);
      row.changes.push({ field: key, value: nextValue(player, key, change) });
    }
    if (row.changes.length) plan.rows.push(row);
  }
  plan.players = seen.size;
  plan.fields = [...changes].map(([key, list]) => ({ key, label: FIELD_BY_KEY.get(key)?.label ?? key, changes: list }));
  return plan;
};

const byCountryThenName = (a: AdminPlayer, b: AdminPlayer) =>
  countryName(a.cc).localeCompare(countryName(b.cc)) || displayName(a).localeCompare(displayName(b));

const cellOf = (p: AdminPlayer, column: CsvColumn, names: CatalogNames) => {
  const key = CSV_FIELDS[column];
  const value = key === 'bio.racket' ? overrideValue(p.override, key) : effectiveValue(p, key);
  if (column === 'hand') return parsePlays(value) ?? '';
  return nameOf(names, value);
};

export const exportCsv = (players: readonly AdminPlayer[], names: CatalogNames) =>
  toCsv([
    ['country', CSV_ID, 'name', ...CSV_COLUMNS],
    ...[...players]
      .sort(byCountryThenName)
      .map((p) => [flagEmoji(p.cc), p.id, displayName(p), ...CSV_COLUMNS.map((c) => cellOf(p, c, names))]),
  ]);
