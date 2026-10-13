import { dayMatchesPath, matchStatPath, type ApiMatch, type ApiMatchStat } from '../bwf.ts';
import type { Context } from '../context.ts';
import { addDays, dayjs, isoRange, utcDay } from '../dates.ts';
import { all, tx } from '../db.ts';
import { FOREVER, pool, type Client, type Fresh } from '../http.ts';
import { fillMissingRounds, normalizeMatch, repairGames, type NormMatch, type NormPlayer } from '../normalize.ts';

const SETTLE_DAYS = 2;

const settledAfter = (day: string) => utcDay(day).add(SETTLE_DAYS + 1, 'day');

const dayFresh =
  (day: string): Fresh =>
  (at) =>
    dayjs(at).isAfter(settledAfter(day));

interface EditionRow {
  code: string;
  tmt_id: number;
  start: string;
  end: string;
}

const isBroken = (m: NormMatch) => m.status === 'F' && !m.winner && !m.note && !!m.code;

const repair = async (client: Client, tmtId: number, matches: NormMatch[]) => {
  let fixed = 0;
  await pool(matches.filter(isBroken), async (m) => {
    const stat = (await client.get<ApiMatchStat>(matchStatPath(tmtId, m.code ?? ''), FOREVER))?.data.results;
    const r1 = stat?.team1_rallies_won;
    const r2 = stat?.team2_rallies_won;
    const result = r1 && r2 ? repairGames(m.games, [r1, r2]) : null;
    if (!result) return;
    m.games = result.games;
    m.winner = result.winner;
    fixed++;
  });
  return fixed;
};

interface Seen extends NormPlayer {
  day: string;
}

const mostCommon = (values: (string | null)[]) => {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

export const syncMatches = async ({ db, client, today, years }: Context) => {
  const horizon = addDays(today, 1);
  const editions = all<EditionRow>(
    db,
    `SELECT code, tmt_id, start, end FROM editions WHERE cancelled = 0 AND start <= ? AND season BETWEEN ? AND ? ORDER BY start`,
    horizon,
    Math.min(...years),
    Math.max(...years),
  );

  const delMatches = db.prepare('DELETE FROM matches WHERE edition = ?');
  const insMatch = db.prepare(`
    INSERT OR REPLACE INTO matches (id, edition, day, code, event, round, grp, time, time_utc, court, status, winner, note, duration, games, seed1, seed2, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insPlayer = db.prepare(
    'INSERT OR REPLACE INTO match_players (match_id, team, pos, player_id, name, cc) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const setEdition = db.prepare('UPDATE editions SET venue = ?, archived = ? WHERE code = ?');
  const upsertPlayer = db.prepare(`
    INSERT INTO players (id, name, cc, photo, slug, last_played) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = CASE WHEN players.bio IS NULL THEN excluded.name ELSE players.name END,
      cc = CASE WHEN players.bio IS NULL THEN excluded.cc ELSE players.cc END,
      photo = COALESCE(excluded.photo, players.photo),
      slug = COALESCE(excluded.slug, players.slug),
      last_played = excluded.last_played`);

  const seen = new Map<string, Seen>();
  let fetchedDays = 0;
  let matchCount = 0;
  let repaired = 0;

  await pool(editions, async (e) => {
    const days = isoRange(e.start, e.end < horizon ? e.end : horizon);
    const results = await pool(days, (day) => client.get<ApiMatch[]>(dayMatchesPath(e.code, day), dayFresh(day)));
    const byDay = days.map((day, i) => ({
      day,
      matches: fillMissingRounds((results[i]?.data ?? []).map(normalizeMatch).filter((m): m is NormMatch => !!m)),
    }));
    for (const { day, matches } of byDay)
      if (settledAfter(day).isBefore(dayjs())) repaired += await repair(client, e.tmt_id, matches);
    const archived =
      e.end < addDays(today, -SETTLE_DAYS) &&
      results.every((r, i) => !!r && dayjs(r.fetchedAt).isAfter(settledAfter(days[i] ?? e.end)));
    fetchedDays += days.length;
    tx(db, () => {
      delMatches.run(e.code);
      for (const { day, matches } of byDay)
        for (const m of matches) {
          matchCount++;
          insMatch.run(
            m.id,
            e.code,
            day,
            m.code,
            m.event,
            m.round,
            m.group,
            m.time,
            m.timeUtc,
            m.court,
            m.status,
            m.winner,
            m.note,
            m.duration,
            JSON.stringify(m.games),
            m.seeds[0],
            m.seeds[1],
            m.location,
          );
          m.teams.forEach((team, t) =>
            team.forEach((p, pos) => {
              insPlayer.run(m.id, t, pos, p.id, p.name, p.cc);
              const prev = seen.get(p.id);
              if (!prev || prev.day <= day) seen.set(p.id, { ...p, photo: p.photo ?? prev?.photo ?? null, day });
            }),
          );
        }
      setEdition.run(mostCommon(byDay.flatMap((d) => d.matches.map((m) => m.location))), archived ? 1 : 0, e.code);
    });
  });

  tx(db, () => {
    for (const p of seen.values()) upsertPlayer.run(p.id, p.name, p.cc, p.photo, p.slug, p.day);
  });
  console.log(
    `matches: ${editions.length} editions · ${fetchedDays} days · ${matchCount} matches · ${repaired} repaired · ${seen.size} players`,
  );
};
