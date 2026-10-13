import { detailPath, type ApiTournamentDetail } from '../bwf.ts';
import type { Context } from '../context.ts';
import { all, tx } from '../db.ts';
import { DAY_MS, FOREVER, pool, within } from '../http.ts';

const DAILY = within(DAY_MS);
const PLACEHOLDER_SERIES = 1;

export const syncDetails = async ({ db, client, currentYear }: Context) => {
  const editions = all<{ code: string; tmt_id: number; season: number }>(
    db,
    'SELECT code, tmt_id, season FROM editions ORDER BY start',
  );
  const update = db.prepare('UPDATE editions SET bwf_series = ?, official_venue = ? WHERE code = ?');
  const details = await pool(editions, async (e) => ({
    code: e.code,
    detail: (await client.get<ApiTournamentDetail>(detailPath(e.tmt_id), e.season < currentYear ? FOREVER : DAILY))
      ?.data.results,
  }));
  tx(db, () => {
    for (const { code, detail } of details)
      update.run(detail?.tournament_series_id ?? null, detail?.venue_name?.trim() || null, code);
  });
  const conflicts = all<{ bwf_series: number; ids: string }>(
    db,
    `SELECT bwf_series, group_concat(DISTINCT series_id) AS ids FROM editions
     WHERE bwf_series > ? GROUP BY bwf_series HAVING COUNT(DISTINCT series_id) > 1`,
    PLACEHOLDER_SERIES,
  );
  for (const c of conflicts) console.warn(`  ! BWF series ${c.bwf_series} spans catalog series ${c.ids}`);
  console.log(`details: ${details.filter((d) => d.detail).length}/${editions.length} editions`);
};
