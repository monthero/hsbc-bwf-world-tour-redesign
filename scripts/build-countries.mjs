import fs from 'node:fs'
import path from 'node:path'

import countries from 'world-countries'

const OUT = path.resolve(import.meta.dirname, '../src/utils/countries.json')

const NAME_OVERRIDES = {
  TPE: 'Chinese Taipei',
  HKG: 'Hong Kong China',
  KOR: 'Korea',
  PRK: 'DPR Korea',
  USA: 'USA',
  CZE: 'Czechia',
  RUS: 'Russia',
  IRI: 'Iran',
}

const EXTRA = {
  ENG: { iso: 'gb-eng', name: 'England', region: 'Europe' },
  SCO: { iso: 'gb-sct', name: 'Scotland', region: 'Europe' },
  WAL: { iso: 'gb-wls', name: 'Wales', region: 'Europe' },
  MAC: { iso: 'mo', name: 'Macau China', region: 'Asia' },
  AIN: { iso: '', name: 'Individual Neutral Athlete', region: 'Other' },
}

const TERRITORIES = new Set(['FRO', 'GRL', 'GUF', 'MNP', 'MYT', 'NCL', 'PYF', 'REU'])

const BADMINTON_EUROPE = new Set(['TUR', 'ISR', 'AZE', 'CYP', 'ARM', 'GEO'])

const regionOf = (c) => {
  if (BADMINTON_EUROPE.has(c.cioc)) return 'Europe'
  return c.region === 'Antarctic' ? 'Other' : c.region
}

const byIoc = {}
for (const c of countries) {
  const code = c.cioc || (TERRITORIES.has(c.cca3) ? c.cca3 : '')
  if (!code) continue
  byIoc[code] = {
    iso: c.cca2.toLowerCase(),
    name: NAME_OVERRIDES[code] ?? c.name.common,
    region: regionOf(c),
  }
}
Object.assign(byIoc, EXTRA)

const sorted = Object.fromEntries(Object.entries(byIoc).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(OUT, `${JSON.stringify(sorted, null, 1)}\n`)
console.log(`countries: ${Object.keys(sorted).length} → ${path.relative(process.cwd(), OUT)}`)
