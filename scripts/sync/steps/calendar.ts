import { calendarPath, type ApiCalendar } from '../bwf.ts'
import type { Edition } from '../catalog.ts'
import type { Context } from '../context.ts'
import { all, tx } from '../db.ts'
import { within } from '../http.ts'

const SIX_HOURS = 6 * 3_600_000

const calendarFresh = (year: number, currentYear: number) => (at: number) =>
  (year < currentYear && at > Date.UTC(year + 1, 1, 1)) || within(SIX_HOURS)(at)

export const syncCalendar = async ({ db, client, catalog, years, currentYear }: Context) => {
  const editions = new Map<string, Edition>()
  let complete = true
  for (const year of years) {
    const res = await client.get<ApiCalendar>(calendarPath(year), calendarFresh(year, currentYear))
    if (!res) complete = false
    for (const t of res?.data.results.flatMap((m) => m.tournaments) ?? []) {
      const e = catalog.edition(t, year)
      if (e) editions.set(e.code, e)
    }
  }

  const upsertSeries = db.prepare(
    'INSERT INTO series (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
  )
  const upsertEdition = db.prepare(`
    INSERT INTO editions (code, tmt_id, series_id, season, slug, level, full_name, title, subtitle, city, country, start, end, prize, logo_version, header_version, cancelled, etihad)
    VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET tmt_id = excluded.tmt_id, series_id = excluded.series_id, season = excluded.season,
      level = excluded.level, full_name = excluded.full_name, title = excluded.title, subtitle = excluded.subtitle,
      city = excluded.city, country = excluded.country, start = excluded.start, end = excluded.end, prize = excluded.prize,
      logo_version = excluded.logo_version, header_version = excluded.header_version, cancelled = excluded.cancelled,
      etihad = excluded.etihad`)
  const setSlug = db.prepare('UPDATE editions SET slug = ? WHERE code = ?')
  const vanished = complete
    ? all<{ code: string }>(db, 'SELECT code FROM editions WHERE season >= ?', Math.min(...years)).filter(
        (r) => !editions.has(r.code),
      )
    : []

  tx(db, () => {
    for (const { code } of vanished) {
      db.prepare('DELETE FROM matches WHERE edition = ?').run(code)
      db.prepare('DELETE FROM editions WHERE code = ?').run(code)
    }
    for (const e of editions.values()) {
      upsertSeries.run(e.seriesId, e.seriesName)
      upsertEdition.run(
        e.code,
        e.tmtId,
        e.seriesId,
        e.season,
        e.level,
        e.fullName,
        e.title,
        e.subtitle,
        e.city,
        e.country,
        e.start,
        e.end,
        e.prize,
        e.logoVersion,
        e.headerVersion,
        e.cancelled ? 1 : 0,
        e.etihad ? 1 : 0,
      )
    }
    db.exec('DELETE FROM series WHERE id NOT IN (SELECT series_id FROM editions)')
    const rows = all<{ code: string; season: number; series_id: string }>(
      db,
      'SELECT code, season, series_id FROM editions ORDER BY season, cancelled, start, code',
    )
    const used = new Set<string>()
    for (const r of rows) {
      let slug = r.series_id
      for (let n = 2; used.has(`${r.season}/${slug}`); n++) slug = `${r.series_id}-${n}`
      used.add(`${r.season}/${slug}`)
      setSlug.run(slug, r.code)
    }
  })

  if (catalog.unknown.size) console.warn(`  ! series not in data/catalog.json: ${[...catalog.unknown].join(' · ')}`)
  console.log(
    `calendar: ${editions.size} editions across ${years.length} seasons${vanished.length ? ` · ${vanished.length} removed` : ''}`,
  )
}
