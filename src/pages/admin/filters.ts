import type { SegmentedOption } from '~/components/ui';
import { SEASON_YEAR } from '~/constants';
import type { EventCode } from '~/types';
import { countryName } from '~/utils/countries';
import { ISO_DAY, today } from '~/utils/dates';
import { countBy, countryOptions, searchTokens, type CountOption } from '~/utils/filter';
import { compareText, foldText } from '~/utils/names';

import { compactKey, nameOf, splitBrand, type BrandMatcher, type CatalogNames } from './catalog';
import {
  displayName,
  effectiveValue,
  EQUIPMENT_FIELDS,
  fieldState,
  MISSING_FIELDS,
  STATUS_FIELDS,
  type FieldState,
} from './fields';
import type { AdminPlayer, FieldKey } from './schema';
import type { Activity, SortKey } from './types';

export interface AdminRow {
  player: AdminPlayer;
  name: string;
  text: string;
  states: Partial<Record<FieldKey, FieldState>>;
  overridden: boolean;
  hasNotes: boolean;
  candidate: boolean;
  brands: readonly string[];
}

export interface Toggle {
  key: string;
  label: string;
  test: (r: AdminRow) => boolean;
}

export interface Criteria {
  query: string;
  cc: string | undefined;
  brand: string | undefined;
  ev: EventCode | undefined;
  active: Activity;
  flags: readonly string[];
  sort: SortKey;
}

export const DEFAULT_SORT: SortKey = 'rank';
export const DEFAULT_ACTIVITY: Activity = 'all';

export const SORT_OPTIONS: readonly SegmentedOption<SortKey>[] = [
  { value: 'rank', label: 'Rank' },
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recent' },
];

export const ACTIVITY_OPTIONS: readonly SegmentedOption<Activity>[] = [
  { value: 'all', label: 'All time' },
  { value: 'season', label: String(SEASON_YEAR) },
  { value: 'year', label: '12 months' },
];

const ACTIVE_SINCE: Record<Activity, () => string> = {
  all: () => '',
  season: () => `${SEASON_YEAR}-01-01`,
  year: () => today().subtract(12, 'month').format(ISO_DAY),
};

export const TOGGLES: readonly Toggle[] = [
  { key: 'ranked', label: 'Ranked', test: (r) => r.player.rank !== null },
  ...MISSING_FIELDS.map((f): Toggle => ({
    key: `no-${f.key}`,
    label: `No ${f.label.toLowerCase()}`,
    test: f.trustBwf === false ? (r) => r.states[f.key] !== 'override' : (r) => r.states[f.key] === 'none',
  })),
  { key: 'possibly-retired', label: 'Possibly retired', test: (r) => r.candidate },
  { key: 'retired', label: 'Retired', test: (r) => !!r.player.override?.retired },
  { key: 'overridden', label: 'Overridden', test: (r) => r.overridden },
  { key: 'notes', label: 'Has notes', test: (r) => r.hasNotes },
];

const byName = (a: AdminRow, b: AdminRow) => compareText(a.name, b.name);

const SORTS: Record<SortKey, (a: AdminRow, b: AdminRow) => number> = {
  rank: (a, b) => (a.player.rank ?? Infinity) - (b.player.rank ?? Infinity) || byName(a, b),
  name: byName,
  recent: (a, b) => compareText(b.player.lastPlayed, a.player.lastPlayed) || byName(a, b),
};

const leadWords = (value: string) =>
  value
    .split(/[\s,.;:(/]+/)
    .filter((w) => compactKey(w))
    .slice(0, 2);

const isShouty = (s: string) => s === s.toUpperCase();

const preferLabel = (labels: Map<string, number>) =>
  [...labels].sort(([a, x], [b, y]) => y - x || Number(isShouty(a)) - Number(isShouty(b)))[0]?.[0] ?? '';

const equipmentOf = (p: AdminPlayer, names: CatalogNames) =>
  EQUIPMENT_FIELDS.map((f) => nameOf(names, effectiveValue(p, f.key))).filter(Boolean);

const brandIndex = (players: readonly AdminPlayer[], known: readonly BrandMatcher[], names: CatalogNames) => {
  const values = new Map(players.map((p) => [p.id, equipmentOf(p, names)]));
  const singles = new Set([...values.values()].flat().map((v) => compactKey(leadWords(v)[0] ?? '')));
  const labels = new Map<string, Map<string, number>>();
  const catalogLabels = new Map(known.map((b) => [compactKey(b.name), b.name]));
  const brandsOf = new Map<string, string[]>();
  for (const [id, list] of values) {
    const keys = list.map((value) => {
      const hit = splitBrand(value, known);
      if (hit) return compactKey(hit.brand.name);
      const [first = '', second = ''] = leadWords(value);
      const joined = compactKey(first + second);
      const pair = second && joined !== compactKey(first) && singles.has(joined);
      const key = pair ? joined : compactKey(first);
      const forms = labels.get(key) ?? new Map<string, number>();
      const label = pair ? `${first} ${second}` : first;
      labels.set(key, forms.set(label, (forms.get(label) ?? 0) + 1));
      return key;
    });
    brandsOf.set(id, [...new Set(keys)]);
  }
  return { labels, catalogLabels, brandsOf };
};

const isCandidate = (p: AdminPlayer, staleBefore: string) =>
  !p.override?.retired && p.lastPlayed < staleBefore && p.retirementNews.length > 0;

const toRow = (player: AdminPlayer, brands: readonly string[], staleBefore: string): AdminRow => ({
  player,
  name: displayName(player),
  text: foldText(`${player.override?.name ?? ''} ${player.name} ${player.id} ${player.cc} ${countryName(player.cc)}`),
  states: Object.fromEntries(STATUS_FIELDS.map((f) => [f.key, fieldState(player, f.key)])),
  overridden: !!player.override,
  hasNotes: !!player.override?.notes?.trim(),
  candidate: isCandidate(player, staleBefore),
  brands,
});

const computeRows = (players: readonly AdminPlayer[], knownBrands: readonly BrandMatcher[], names: CatalogNames) => {
  const { labels, catalogLabels, brandsOf } = brandIndex(players, knownBrands, names);
  const staleBefore = ACTIVE_SINCE.year();
  const rows = players.map((p) => toRow(p, brandsOf.get(p.id) ?? [], staleBefore));
  const countries = countryOptions(rows, (r) => [r.player.cc]);
  const brands: CountOption[] = [...countBy(rows, (r) => r.brands)]
    .map(([value, count]) => ({
      value,
      label: catalogLabels.get(value) ?? preferLabel(labels.get(value) ?? new Map()),
      count,
    }))
    .sort((a, b) => b.count - a.count || compareText(a.label, b.label));
  return { rows, countries, brands };
};

type BuiltRows = ReturnType<typeof computeRows>;

const NO_NAMES: CatalogNames = new Map();

const builtCache = new WeakMap<readonly AdminPlayer[], WeakMap<CatalogNames, Map<string, BuiltRows>>>();

export const buildRows = (
  players: readonly AdminPlayer[],
  knownBrands: readonly BrandMatcher[],
  names = NO_NAMES,
): BuiltRows => {
  const byNames = builtCache.get(players) ?? new WeakMap<CatalogNames, Map<string, BuiltRows>>();
  builtCache.set(players, byNames);
  const byBrands = byNames.get(names) ?? new Map<string, BuiltRows>();
  byNames.set(names, byBrands);
  const key = knownBrands.map((b) => b.keys.join('|')).join('\u0000');
  const hit = byBrands.get(key);
  if (hit) return hit;
  const built = computeRows(players, knownBrands, names);
  byBrands.set(key, built);
  return built;
};

export const filterRows = (rows: readonly AdminRow[], c: Criteria) => {
  const tokens = searchTokens(c.query);
  const since = ACTIVE_SINCE[c.active]();
  const toggles = TOGGLES.filter((t) => c.flags.includes(t.key));
  return rows
    .filter(
      (r) =>
        (!c.cc || r.player.cc === c.cc) &&
        (!c.brand || r.brands.includes(c.brand)) &&
        (!c.ev || r.player.events.includes(c.ev)) &&
        (!since || r.player.lastPlayed >= since) &&
        tokens.every((t) => r.text.includes(t)) &&
        toggles.every((t) => t.test(r)),
    )
    .sort(SORTS[c.sort]);
};
