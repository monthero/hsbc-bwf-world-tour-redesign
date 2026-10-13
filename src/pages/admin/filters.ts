import type { SegmentedOption } from '~/components/ui'
import { SEASON_YEAR } from '~/constants'
import type { EventCode } from '~/types'
import { countryName } from '~/utils/countries'
import { ISO_DAY, today } from '~/utils/dates'
import { compareText, foldText } from '~/utils/names'

import { compactKey, splitBrand, type BrandMatcher } from './catalog'
import {
  displayName,
  effectiveValue,
  EQUIPMENT_FIELDS,
  fieldState,
  MISSING_FIELDS,
  STATUS_FIELDS,
  type FieldState,
} from './fields'
import type { AdminPlayer, FieldKey } from './schema'
import type { Activity, SortKey } from './types'

export interface AdminRow {
  player: AdminPlayer
  name: string
  text: string
  states: Partial<Record<FieldKey, FieldState>>
  overridden: boolean
  hasNotes: boolean
  brands: readonly string[]
}

export interface CountOption {
  value: string
  label: string
  count: number
}

export interface Toggle {
  key: string
  label: string
  test: (r: AdminRow) => boolean
}

export interface Criteria {
  query: string
  cc: string | undefined
  brand: string | undefined
  ev: EventCode | undefined
  active: Activity
  flags: readonly string[]
  sort: SortKey
}

export const DEFAULT_SORT: SortKey = 'rank'
export const DEFAULT_ACTIVITY: Activity = 'all'

export const SORT_OPTIONS: readonly SegmentedOption<SortKey>[] = [
  { value: 'rank', label: 'Rank' },
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recent' },
]

export const ACTIVITY_OPTIONS: readonly SegmentedOption<Activity>[] = [
  { value: 'all', label: 'All time' },
  { value: 'season', label: String(SEASON_YEAR) },
  { value: 'year', label: '12 months' },
]

const ACTIVE_SINCE: Record<Activity, () => string> = {
  all: () => '',
  season: () => `${SEASON_YEAR}-01-01`,
  year: () => today().subtract(12, 'month').format(ISO_DAY),
}

export const TOGGLES: readonly Toggle[] = [
  { key: 'ranked', label: 'Ranked', test: (r) => r.player.rank !== null },
  ...MISSING_FIELDS.map((f): Toggle => ({
    key: `no-${f.key}`,
    label: `No ${f.label.toLowerCase()}`,
    test: f.trustBwf === false ? (r) => r.states[f.key] !== 'override' : (r) => r.states[f.key] === 'none',
  })),
  { key: 'overridden', label: 'Overridden', test: (r) => r.overridden },
  { key: 'notes', label: 'Has notes', test: (r) => r.hasNotes },
]

const byName = (a: AdminRow, b: AdminRow) => compareText(a.name, b.name)

const SORTS: Record<SortKey, (a: AdminRow, b: AdminRow) => number> = {
  rank: (a, b) => (a.player.rank ?? Infinity) - (b.player.rank ?? Infinity) || byName(a, b),
  name: byName,
  recent: (a, b) => compareText(b.player.lastPlayed, a.player.lastPlayed) || byName(a, b),
}

const leadWords = (value: string) =>
  value
    .split(/[\s,.;:(/]+/)
    .filter((w) => compactKey(w))
    .slice(0, 2)

const isShouty = (s: string) => s === s.toUpperCase()

const preferLabel = (labels: Map<string, number>) =>
  [...labels].sort(([a, x], [b, y]) => y - x || Number(isShouty(a)) - Number(isShouty(b)))[0]?.[0] ?? ''

const equipmentOf = (p: AdminPlayer) => EQUIPMENT_FIELDS.map((f) => effectiveValue(p, f.key)).filter(Boolean)

const brandIndex = (players: readonly AdminPlayer[], known: readonly BrandMatcher[]) => {
  const values = new Map(players.map((p) => [p.id, equipmentOf(p)]))
  const singles = new Set([...values.values()].flat().map((v) => compactKey(leadWords(v)[0] ?? '')))
  const labels = new Map<string, Map<string, number>>()
  const catalogLabels = new Map(known.map((b) => [compactKey(b.name), b.name]))
  const brandsOf = new Map<string, string[]>()
  for (const [id, list] of values) {
    const keys = list.map((value) => {
      const hit = splitBrand(value, known)
      if (hit) return compactKey(hit.brand.name)
      const [first = '', second = ''] = leadWords(value)
      const joined = compactKey(first + second)
      const pair = second && joined !== compactKey(first) && singles.has(joined)
      const key = pair ? joined : compactKey(first)
      const forms = labels.get(key) ?? new Map<string, number>()
      const label = pair ? `${first} ${second}` : first
      labels.set(key, forms.set(label, (forms.get(label) ?? 0) + 1))
      return key
    })
    brandsOf.set(id, [...new Set(keys)])
  }
  return { labels, catalogLabels, brandsOf }
}

const toRow = (player: AdminPlayer, brands: readonly string[]): AdminRow => ({
  player,
  name: displayName(player),
  text: foldText(`${player.override?.name ?? ''} ${player.name} ${player.id} ${player.cc} ${countryName(player.cc)}`),
  states: Object.fromEntries(STATUS_FIELDS.map((f) => [f.key, fieldState(player, f.key)])),
  overridden: !!player.override,
  hasNotes: !!player.override?.notes?.trim(),
  brands,
})

const countBy = (rows: readonly AdminRow[], keysOf: (r: AdminRow) => readonly string[]) => {
  const counts = new Map<string, number>()
  for (const r of rows) for (const k of keysOf(r)) counts.set(k, (counts.get(k) ?? 0) + 1)
  return counts
}

const computeRows = (players: readonly AdminPlayer[], knownBrands: readonly BrandMatcher[]) => {
  const { labels, catalogLabels, brandsOf } = brandIndex(players, knownBrands)
  const rows = players.map((p) => toRow(p, brandsOf.get(p.id) ?? []))
  const countries: CountOption[] = [...countBy(rows, (r) => [r.player.cc])]
    .map(([value, count]) => ({ value, label: countryName(value), count }))
    .sort((a, b) => compareText(a.label, b.label))
  const brands: CountOption[] = [...countBy(rows, (r) => r.brands)]
    .map(([value, count]) => ({
      value,
      label: catalogLabels.get(value) ?? preferLabel(labels.get(value) ?? new Map()),
      count,
    }))
    .sort((a, b) => b.count - a.count || compareText(a.label, b.label))
  return { rows, countries, brands }
}

type BuiltRows = ReturnType<typeof computeRows>

const builtCache = new WeakMap<readonly AdminPlayer[], Map<string, BuiltRows>>()

export const buildRows = (players: readonly AdminPlayer[], knownBrands: readonly BrandMatcher[]): BuiltRows => {
  const byBrands = builtCache.get(players) ?? new Map<string, BuiltRows>()
  builtCache.set(players, byBrands)
  const key = knownBrands.map((b) => b.keys.join('|')).join('\u0000')
  const hit = byBrands.get(key)
  if (hit) return hit
  const built = computeRows(players, knownBrands)
  byBrands.set(key, built)
  return built
}

export const filterRows = (rows: readonly AdminRow[], c: Criteria) => {
  const tokens = foldText(c.query).split(/\s+/).filter(Boolean)
  const since = ACTIVE_SINCE[c.active]()
  const toggles = TOGGLES.filter((t) => c.flags.includes(t.key))
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
    .sort(SORTS[c.sort])
}
