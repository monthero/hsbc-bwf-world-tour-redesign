import { parseHeightCm } from '../../../src/utils/format.ts';
import { bioPath, summaryPath, type ApiBio, type ApiSummary } from '../bwf.ts';
import type { Context } from '../context.ts';
import { addDays, DAY_MS } from '../dates.ts';
import { all, tx } from '../db.ts';
import { pool, within } from '../http.ts';
import { photoOf } from '../normalize.ts';
import { collapseSpaces } from '../util.ts';

const ACTIVE_REFRESH = within(30 * DAY_MS);
const IDLE_REFRESH = within(180 * DAY_MS);
const JUNK = /^(?:-+|n\/?a|none|null|nil|\.|0)$/i;

const text = (...values: (string | null | undefined)[]) => {
  for (const v of values) {
    const s = v && collapseSpaces(v);
    if (s && !JUNK.test(s)) return s;
  }
  return undefined;
};

const HANDS: Record<string, string> = { R: 'Right-handed', L: 'Left-handed', '1': 'Right-handed', '2': 'Left-handed' };

const heightOf = (...values: (string | null | undefined)[]) =>
  values.map(parseHeightCm).find((cm) => cm !== null) ?? undefined;

const compact = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

const buildBio = (summary: ApiSummary['results'], bio: ApiBio | null) => {
  const m = summary?.bio_model ?? {};
  const qa = bio?.qa ?? {};
  const prize = text(bio?.prize_money);
  return compact({
    born: summary?.date_of_birth?.slice(0, 10),
    age: bio?.age ?? undefined,
    height: heightOf(bio?.height, m.height),
    plays: HANDS[text(bio?.hand, m.plays) ?? ''],
    birthplace: text(m.pob, qa.place_of_birth),
    residence: text(m.current_residence, bio?.current_residence),
    languages: text(m.languages, bio?.languages),
    natTeam: text(m.member_national_team_since, qa.member_national_team_since),
    prize: prize && prize !== '0' ? `$${prize}` : undefined,
    ambition: text(m.sporting_ambitions, qa.sporting_ambitions),
    debut: text(m.international_debut),
    coach: text(m.coach),
    club: text(m.club),
    racket: text(m.equipment_sponsor),
    nickname: text(m.nickname),
    started: text(m.start_playing_competitively, qa.start_playing_competitively),
    achievements: text(m.memorable_achievements),
    idol: text(m.sporting_hero),
    instagram: text(m.instagram),
    facebook: text(m.facebook),
  });
};

const heroOf = (url: string | null | undefined) => url?.match(/\/(v\d+)\/assets\/players\/hero\//)?.[1] ?? null;

export const syncPlayers = async ({ db, client, today }: Context) => {
  const activeSince = addDays(today, -365);
  const players = all<{ id: string; last_played: string }>(db, 'SELECT id, last_played FROM players ORDER BY id');
  const update = db.prepare(`
    UPDATE players SET name = COALESCE(?, name), cc = COALESCE(?, cc), photo = COALESCE(photo, ?), hero = ?, slug = COALESCE(?, slug), bio = ?
    WHERE id = ?`);

  let done = 0;
  const results = await pool(players, async (p) => {
    const fresh = p.last_played >= activeSince ? ACTIVE_REFRESH : IDLE_REFRESH;
    const [summary, bio] = await Promise.all([
      client.get<ApiSummary>(summaryPath(p.id), fresh),
      client.get<ApiBio>(bioPath(p.id), fresh),
    ]);
    if (++done % 500 === 0) console.log(`  players ${done}/${players.length}`);
    return { id: p.id, summary: summary?.data.results ?? null, bio: bio?.data ?? null };
  });

  tx(db, () => {
    for (const { id, summary, bio } of results)
      update.run(
        collapseSpaces(summary?.name_display ?? '') || null,
        summary?.nationality || null,
        photoOf(summary?.avatar?.url_cloudinary),
        heroOf(summary?.hero_image?.url_cloudinary_large),
        summary?.slug ?? null,
        JSON.stringify(buildBio(summary, bio)),
        id,
      );
  });
  console.log(`players: ${players.length} profiles`);
};
