import { countryName, flagEmoji } from '~/utils/countries';
import { parseCsv, toCsv } from '~/utils/csv';
import { parsePlays } from '~/utils/format';

import { isBrandOnly, type BrandMatcher } from './catalog';
import { bwfValue, displayName, effectiveValue, FIELD_BY_KEY, planBulk, type BulkChange } from './fields';
import {
  bioKeyOf,
  CSV_FIELDS,
  CSV_ID,
  decodeBio,
  type AdminPlayer,
  type BioFieldKey,
  type CsvColumn,
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
  return decodeBio(bioKey, bwfValue(player, key)) === decodeBio(bioKey, change.next) ? null : change.next;
};

export const planImport = (text: string, players: readonly AdminPlayer[]): ImportPlan => {
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
      const value = cells[at]?.trim();
      if (!value) continue;
      if (decodeBio(bioKeyOf(key), value) === undefined) {
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

const cellOf = (p: AdminPlayer, column: CsvColumn, brands: readonly BrandMatcher[]) => {
  const value = effectiveValue(p, CSV_FIELDS[column]);
  if (column === 'hand') return parsePlays(value) ?? '';
  return column === 'racket' && isBrandOnly(value, brands) ? '' : value;
};

export const exportCsv = (players: readonly AdminPlayer[], brands: readonly BrandMatcher[]) =>
  toCsv([
    ['country', CSV_ID, 'name', ...CSV_COLUMNS],
    ...[...players]
      .sort(byCountryThenName)
      .map((p) => [flagEmoji(p.cc), p.id, displayName(p), ...CSV_COLUMNS.map((c) => cellOf(p, c, brands))]),
  ]);
