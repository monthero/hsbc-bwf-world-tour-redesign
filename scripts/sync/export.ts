import fs from 'node:fs';
import path from 'node:path';

import { EventCode, MonthKey, type EditionRef, type Retirement } from '../../src/api/schemas.ts';
import { imageAssetPath, ImageKind } from '../../src/pages/admin/schema.ts';
import { parseHeightCm, parsePlays, tidySpaces } from '../../src/utils/parse.ts';
import { dominantOffset, utcOffsetOf } from '../../src/utils/utc-offset.ts';
import {
  historyPath,
  publicationsPath,
  RACE,
  RACE_CATEGORIES,
  WORLD,
  WORLD_CATEGORIES,
  type ApiHistory,
  type ApiHistoryRow,
  type ApiPublication,
  type ApiRankingTable,
  type ApiWeeklyRow,
} from './bwf.ts';
import { readCredits, wikimediaImages } from './credits.ts';
import { dayjs } from './dates.ts';
import { all, unzipJson, type Db } from './db.ts';
import { dataIssues, readCatalog, resolveEquipment, toRows } from './equipment.ts';
import { createMapPlacer } from './geo.ts';
import { FOREVER, type Client } from './http.ts';
import type { Output } from './output.ts';
import { weeklyHistory } from './steps/rankings.ts';
import { groupBy, push, readJsonFile, readOverrides } from './util.ts';

interface Person {
  id: string;
  name: string;
  cc: string;
}

interface Team {
  seed: number | null;
  players: Person[];
}

interface MatchDto {
  court: number;
  time: string;
  event: string;
  round: string;
  group?: string;
  status: string;
  winner: number;
  teams: [Team, Team];
  games: [number, number][];
  durationMin: number;
  serve: number;
  note: string | null;
  code?: string;
}

interface MatchRow {
  id: number;
  edition: string;
  day: string;
  code: string | null;
  event: string;
  round: string;
  grp: string | null;
  time: string;
  time_utc: string | null;
  court: number;
  status: string;
  winner: number;
  note: string | null;
  duration: number;
  games: string;
  seed1: number | null;
  seed2: number | null;
}

interface EditionRow {
  code: string;
  tmt_id: number;
  series_id: string;
  series_name: string;
  season: number;
  slug: string;
  level: string;
  title: string;
  subtitle: string | null;
  city: string;
  country: string;
  venue: string | null;
  official_venue: string | null;
  start: string;
  end: string;
  prize: number;
  logo_version: string;
  header_version: string;
  cancelled: number;
  archived: number;
  etihad: number;
  match_count: number;
}

interface PlayerRow {
  id: string;
  name: string;
  cc: string;
  photo: string | null;
  hero: string | null;
  slug: string | null;
  bio: string | null;
}

interface CurrentRank {
  ev: string;
  r: number | null;
  pr: number | null;
  w: string;
  wid?: string;
  hi: number | null;
  hw: string;
  hwid?: string;
  also?: { r: number; pr: number | null; w: string; wid?: string }[];
}

interface PreviousPlayers {
  players: Record<string, { ranks?: CurrentRank[] }>;
}

interface RankingPlayerRow {
  id: string;
  name: string;
  cc: string;
  photo: string | null;
}

interface RankingRowDto {
  rank: number;
  prev: number | null;
  points: number;
  tournaments: number | null;
  players: (RankingPlayerRow & { known: boolean })[];
}

const RANKING_TABLES = [
  { kind: 'world', id: WORLD, categories: WORLD_CATEGORIES, name: 'BWF World Rankings' },
  { kind: 'race', id: RACE, categories: RACE_CATEGORIES, name: 'HSBC Race to Finals' },
] as const;

const EVENT_ORDER: readonly string[] = EventCode.options;
const FINAL = 'F';

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s\-(./])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());

const venueOf = (e: EditionRow) => {
  const v = e.official_venue ?? e.venue;
  return v && v === v.toUpperCase() ? titleCase(v) : v;
};

const wordSet = (name: string) =>
  name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .toSorted((a, b) => a.localeCompare(b))
    .join(' ');

const isCancelled = (e: EditionRow) => !!e.cancelled || (!!e.archived && e.match_count === 0);

const tidyValues = (bio: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(bio).map(([k, v]) => [k, typeof v === 'string' ? tidySpaces(v) : v]));

const normalizeBio = (bio: Record<string, unknown>) => {
  const { height, plays, ...rest } = tidyValues(bio);
  const cm = parseHeightCm(height);
  const hand = parsePlays(plays);
  return { ...rest, ...(cm && { height: cm }), ...(hand && { plays: hand }) };
};

const dayOffsets = (rows: readonly MatchRow[]) => {
  const byDay = new Map<string, (number | null)[]>();
  for (const r of rows) push(byDay, r.day, utcOffsetOf(r.day, r.time, r.time_utc));
  return Object.fromEntries(
    [...byDay].flatMap(([day, list]) => {
      const offset = dominantOffset(list);
      return offset === null ? [] : [[day, offset] as const];
    }),
  );
};

const flip = (games: [number, number][]) => games.map(([a, b]): [number, number] => [b, a]);

type WeeklyPoint = [string, number, number, number | null];

const pairKey = (category: number, a: number | null, b: number | null) =>
  `${category}|${[a ?? 0, b ?? 0].toSorted((x, y) => x - y).join('/')}`;

const pairFirsts = (rows: readonly ApiWeeklyRow[]) => {
  const out = new Map<string, string>();
  for (const r of rows) {
    const date = r.publication_date?.slice(0, 10);
    const key = pairKey(r.ranking_category_id, r.player1_id, r.player2_id);
    const cur = out.get(key);
    if (date && (!cur || date < cur)) out.set(key, date);
  }
  return out;
};

const weeklySeries = (rows: readonly ApiWeeklyRow[], self: string, until: string) => {
  const best = new Map<string, { ev: EventCode; date: string; row: ApiWeeklyRow }>();
  for (const r of rows) {
    const ev = WORLD_CATEGORIES[r.ranking_category_id];
    const date = r.publication_date?.slice(0, 10);
    if (!ev || !date || date > until || !r.rank) continue;
    const key = `${ev}|${date}`;
    const cur = best.get(key);
    if (!cur || r.rank < cur.row.rank) best.set(key, { ev, date, row: r });
  }
  return [...groupBy([...best.values()], (x) => x.ev)].map(([ev, xs]) => ({
    ev,
    w: xs
      .toSorted((a, b) => a.date.localeCompare(b.date))
      .map(({ date, row: r }): WeeklyPoint => {
        const partner = String(r.player1_id) === self ? r.player2_id : r.player1_id;
        return [date, r.rank, Math.round(Number.parseFloat(r.points) || 0), partner || null];
      }),
  }));
};

export const exportData = async (
  db: Db,
  client: Client,
  publicDir: string,
  currentYear: number,
  overridesFile: string,
  reportFile: string,
  output: Output,
  onlyPlayers?: ReadonlySet<string>,
) => {
  const write = (rel: string, data: unknown) => output.write(rel, JSON.stringify(data));
  const playersFile = path.join(publicDir, 'data/players.json');
  const full = !onlyPlayers || !fs.existsSync(playersFile);

  const editions = all<EditionRow>(
    db,
    `SELECT e.*, s.name AS series_name, (SELECT COUNT(*) FROM matches m WHERE m.edition = e.code) AS match_count
     FROM editions e JOIN series s ON s.id = e.series_id ORDER BY e.start, e.code`,
  );
  const editionOf = new Map(editions.map((e) => [e.code, e]));

  const overrides = readOverrides(overridesFile);
  const catalog = readCatalog(path.dirname(overridesFile));
  const issues = dataIssues(catalog, overrides);
  if (issues.length) throw new Error(`Curated data has problems:\n${issues.join('\n')}`);
  const products = new Map(toRows(catalog).map((r) => [r.id, r]));
  const nameOverride = (id: string) => overrides[id]?.name?.trim() || undefined;
  const missingAssets: string[] = [];
  const overrideAssets = new Map(
    Object.entries(overrides).flatMap(([id, o]) =>
      ImageKind.options.flatMap((kind) => {
        if (!o[kind]) return [];
        const asset = imageAssetPath(id, kind);
        if (fs.existsSync(path.join(publicDir, asset))) return [[`${id}:${kind}`, asset] as const];
        missingAssets.push(asset);
        return [];
      }),
    ),
  );
  const overrideImage = (id: string, kind: ImageKind) => overrideAssets.get(`${id}:${kind}`);
  const matchNameOf = new Map(
    all<{ player_id: string; name: string }>(
      db,
      'SELECT player_id, name FROM match_players GROUP BY player_id, name ORDER BY COUNT(*)',
    ).map((r) => [r.player_id, r.name]),
  );
  const bwfNameOf = (p: PlayerRow) => {
    const fromMatches = matchNameOf.get(p.id);
    return fromMatches && wordSet(fromMatches) === wordSet(p.name) ? fromMatches : p.name;
  };
  const players = all<PlayerRow>(db, 'SELECT id, name, cc, photo, hero, slug, bio FROM players').map((p) => ({
    ...p,
    name: nameOverride(p.id) ?? bwfNameOf(p),
    bwfName: bwfNameOf(p),
    photo: overrideImage(p.id, 'photo') ?? p.photo ?? null,
    hero: overrideImage(p.id, 'hero') ?? p.hero ?? null,
  }));
  const playerOf = new Map(players.map((p) => [p.id, p]));
  const bioOf = (p: PlayerRow) => {
    const { racket: _bwfRacket, ...bwf } = p.bio ? (JSON.parse(p.bio) as Record<string, unknown>) : {};
    return normalizeBio({ ...bwf, ...resolveEquipment(overrides[p.id]?.bio, products) });
  };
  const nameOf = (id: number | string | null | undefined, fallback: string | null = '') => {
    const key = id ? String(id) : '';
    return (key && (nameOverride(key) ?? playerOf.get(key)?.name)) || fallback || '';
  };

  const teamsOf = new Map<number, [Person[], Person[]]>();
  for (const r of all<{ match_id: number; team: number; player_id: string; name: string; cc: string }>(
    db,
    'SELECT match_id, team, player_id, name, cc FROM match_players ORDER BY match_id, team, pos',
  )) {
    let teams = teamsOf.get(r.match_id);
    if (!teams) teamsOf.set(r.match_id, (teams = [[], []]));
    teams[r.team]?.push({ id: r.player_id, name: nameOf(r.player_id, r.name), cc: r.cc });
  }

  const rows = all<MatchRow>(db, 'SELECT * FROM matches ORDER BY day, time, court, id');
  const toDto = (m: MatchRow): MatchDto => {
    const [a = [], b = []] = teamsOf.get(m.id) ?? [];
    return {
      court: m.court,
      time: m.time,
      event: m.event,
      round: m.round,
      ...(m.grp ? { group: m.grp } : {}),
      status: m.status,
      winner: m.winner,
      teams: [
        { seed: m.seed1, players: a },
        { seed: m.seed2, players: b },
      ],
      games: JSON.parse(m.games) as [number, number][],
      durationMin: m.duration,
      serve: 0,
      note: m.note,
      ...(m.code ? { code: m.code } : {}),
    };
  };

  const byEdition = new Map<string, { row: MatchRow; dto: MatchDto }[]>();
  const byPlayer = new Map<string, { tournament: string; day: string; dto: MatchDto }[]>();
  for (const row of rows) {
    const dto = toDto(row);
    push(byEdition, row.edition, { row, dto });
    for (const p of dto.teams.flatMap((t) => t.players))
      push(byPlayer, p.id, { tournament: row.edition, day: row.day, dto });
  }

  const finalsOf = (code: string) =>
    (byEdition.get(code) ?? [])
      .filter(({ dto }) => dto.round === FINAL && dto.winner > 0)
      .sort((a, b) => EVENT_ORDER.indexOf(a.dto.event) - EVENT_ORDER.indexOf(b.dto.event))
      .map(({ dto }) => {
        const w = dto.winner - 1;
        return {
          event: dto.event,
          winners: dto.teams[w]?.players ?? [],
          losers: dto.teams[1 - w]?.players ?? [],
          games: w ? flip(dto.games) : dto.games,
          note: dto.note,
        };
      });

  const seasons = groupBy(editions, (e) => e.season);

  const placer = createMapPlacer();
  const zoneOf = (e: EditionRow) => placer.zoneOf(e.city, e.country);
  if (full)
    for (const [year, list] of seasons)
      write(`calendar-${year}.json`, {
        year,
        events: list.map((e) => ({
          code: e.code,
          tmtId: e.tmt_id,
          year,
          slug: e.slug,
          series: e.series_id,
          name: e.series_name,
          title: e.title,
          subtitle: e.subtitle,
          city: e.city,
          country: e.country,
          venue: venueOf(e),
          level: e.level,
          start: e.start,
          end: e.end,
          prize: e.prize,
          logoVersion: e.logo_version,
          headerVersion: e.header_version,
          cancelled: isCancelled(e),
          archived: !!e.archived || isCancelled(e),
          map: placer.pointOf(e.city, e.country),
          timeZone: zoneOf(e),
          etihad: !!e.etihad,
          winners: finalsOf(e.code).map((f) => ({ event: f.event, players: f.winners })),
        })),
      });
  placer.warn();

  if (full)
    write('seasons.json', {
      current: currentYear,
      seasons: [...seasons]
        .sort(([a], [b]) => b - a)
        .map(([year, list]) => ({
          year,
          events: list.filter((e) => !isCancelled(e)).length,
          completed: list.filter((e) => e.archived && !isCancelled(e)).length,
        })),
    });

  if (full)
    for (const [code, list] of byEdition) {
      const e = editionOf.get(code);
      const days: Record<string, MatchDto[]> = {};
      for (const { row, dto } of list) (days[row.day] ??= []).push(dto);
      const utcOffsets = e && !zoneOf(e) ? dayOffsets(list.map(({ row }) => row)) : {};
      write(`tournaments/${code}.json`, {
        code,
        asOf: e?.archived ? 'final results' : dayjs.utc().format('YYYY-MM-DD HH:mm'),
        days,
        plannedDays: {},
        ...(Object.keys(utcOffsets).length ? { utcOffsets } : {}),
      });
    }

  const seriesEditions = groupBy(editions, (e) => e.series_id);
  if (full)
    for (const [id, list] of seriesEditions)
      write(`series/${id}.json`, {
        id,
        name: list[0]?.series_name ?? id,
        editions: list
          .toSorted((a, b) => b.start.localeCompare(a.start))
          .map((e) => ({
            code: e.code,
            year: e.season,
            slug: e.slug,
            title: e.title,
            level: e.level,
            city: e.city,
            country: e.country,
            venue: venueOf(e),
            start: e.start,
            end: e.end,
            cancelled: isCancelled(e),
            finals: finalsOf(e.code),
          })),
      });

  const pubs = new Map(
    all<{ ranking: number; id: number; date: string; week: string; name: string | null }>(
      db,
      'SELECT * FROM publications',
    ).map((p) => [p.ranking, p]),
  );
  const worldPub = pubs.get(WORLD);

  const ranksOf = new Map<string, CurrentRank[]>();
  const weeklyRank = new Map<string, Map<string, number>>();
  const rankWeeks = new Set<string>();
  if (!full)
    for (const [id, rec] of Object.entries(readJsonFile<PreviousPlayers>(playersFile).players))
      if (rec.ranks?.length) ranksOf.set(id, rec.ranks);
  if (worldPub && full) {
    const ranked = all<{ id: string }>(
      db,
      `SELECT DISTINCT p.id FROM players p JOIN rankings r ON r.ranking = ? AND (r.player1 = p.id OR r.player2 = p.id)`,
      WORLD,
    );
    for (const { id } of ranked) {
      const res = await client.get<ApiHistory>(historyPath(id, worldPub.id), FOREVER);
      const history = res?.data.data ?? [];
      if (!history.length) continue;
      const partnerOf = (h: ApiHistoryRow) => (String(h.player1_id) === id ? h.player2_id : h.player1_id);
      const partnerId = (h: ApiHistoryRow) => String(partnerOf(h) || '');
      const partnerName = (h: ApiHistoryRow) =>
        nameOf(partnerOf(h), String(h.player1_id) === id ? h.player_2_name : h.player_1_name);
      const ranks: CurrentRank[] = [];
      for (const [cat, ev] of Object.entries(WORLD_CATEGORIES)) {
        const rowsOf = history.filter((h) => h.ranking_category_id === Number(cat));
        if (!rowsOf.length) continue;
        const best = rowsOf.reduce<ApiHistoryRow | null>(
          (b, h) => (h.highest_rank && (!b?.highest_rank || h.highest_rank < b.highest_rank) ? h : b),
          null,
        );
        const now = rowsOf.filter((h) => h.ranking_publication_id === worldPub.id).sort((a, b) => a.rank - b.rank);
        const top = now[0];
        const also = now.slice(1).map((h) => ({
          r: h.rank,
          pr: h.rank_previous,
          w: partnerName(h),
          ...(partnerId(h) && { wid: partnerId(h) }),
        }));
        ranks.push({
          ev,
          r: top?.rank ?? null,
          pr: top?.rank_previous ?? null,
          w: top ? partnerName(top) : '',
          ...(top && partnerId(top) && { wid: partnerId(top) }),
          hi: best?.highest_rank ?? null,
          hw: best ? partnerName(best) : '',
          ...(best && partnerId(best) && { hwid: partnerId(best) }),
          ...(also.length > 0 && { also }),
        });
      }
      ranksOf.set(id, ranks);
      const { rows: weeks } = await weeklyHistory(client, id, history, currentYear, worldPub.id);
      const firsts = pairFirsts(weeks);
      const weekly = weeklySeries(weeks, id, worldPub.date);
      const byWeek = new Map<string, number>();
      for (const { ev, w } of weekly)
        for (const [date, rank] of w) {
          byWeek.set(`${ev}|${date}`, rank);
          rankWeeks.add(date);
        }
      weeklyRank.set(id, byWeek);
      write(`rankings/${id}.json`, {
        id,
        name: nameOf(id),
        publicationId: worldPub.id,
        weekly,
        history: history.map((h) => ({
          event: WORLD_CATEGORIES[h.ranking_category_id] ?? null,
          publicationId: h.ranking_publication_id,
          player1Id: h.player1_id,
          player2Id: h.player2_id,
          player1Name: nameOf(h.player1_id, h.player_1_name),
          player2Name: h.player2_id ? nameOf(h.player2_id, h.player_2_name) : null,
          rank: h.rank,
          rankPrevious: h.rank_previous,
          highestRank: h.highest_rank ?? h.rank,
          totalWeeks: h.total_weeks,
          date: h.date?.slice(0, 10) ?? null,
          first: firsts.get(pairKey(h.ranking_category_id, h.player1_id, h.player2_id)) ?? null,
          points: Number.parseFloat(h.points) || 0,
          breakdown: h.rankingBreakdowns.map((b) => ({
            tournament: b.tournament?.name ?? '',
            year: b.year,
            week: b.week,
            result: b.result,
            points: b.points,
            counted: b.ranking_calc === 1,
          })),
        })),
      });
    }
  }

  if (full) {
    const publicationOn = new Map(
      ((await client.get<ApiPublication[]>(publicationsPath(WORLD), FOREVER))?.data ?? []).map((p) => [
        p.date.slice(0, 10),
        p.id,
      ]),
    );
    const weeks = [...new Set([...rankWeeks, ...publicationOn.keys()])].sort((a, b) => a.localeCompare(b));
    const tables = new Map<number, Map<string, number>>();
    const tableOf = (publication: number) => {
      const known = tables.get(publication);
      if (known) return known;
      const table = new Map<string, number>();
      for (const { body } of all<{ body: Uint8Array }>(
        db,
        'SELECT body FROM responses WHERE path LIKE ?',
        `vue-rankingtable?rankId=${WORLD}&catId=%&publicationId=${publication}&%`,
      ))
        for (const r of (unzipJson(body) as ApiRankingTable).results.data) {
          const ev = WORLD_CATEGORIES[r.ranking_category_id];
          if (ev)
            for (const id of [r.player1_id, r.player2_id])
              if (id) table.set(`${ev}|${id}`, Math.min(r.rank, table.get(`${ev}|${id}`) ?? r.rank));
        }
      tables.set(publication, table);
      return table;
    };
    for (const [code, list] of byEdition) {
      const e = editionOf.get(code);
      const week = e && weeks.findLast((w) => w <= e.start);
      if (!week || !worldPub || week >= worldPub.date) continue;
      const publication = publicationOn.get(week);
      const table = publication ? tableOf(publication) : undefined;
      const ranks: Record<string, Record<string, number>> = {};
      for (const { dto } of list)
        for (const p of dto.teams.flatMap((t) => t.players)) {
          const key = `${dto.event}|${p.id}`;
          const r = table?.get(key) ?? weeklyRank.get(p.id)?.get(`${dto.event}|${week}`);
          if (r) (ranks[p.id] ??= {})[dto.event] = r;
        }
      write(`tournament-ranks/${code}.json`, { code, week, ranks });
    }
  }

  const race: Record<string, { ev: string; r: number; pr: number | null; n: string; w: string; pts: number }[]> = {};
  for (const r of all<{
    category: number;
    player1: string;
    player2: string;
    rank: number;
    rank_previous: number | null;
    points: number;
  }>(
    db,
    'SELECT category, player1, player2, rank, rank_previous, points FROM rankings WHERE ranking = ? ORDER BY rank',
    RACE,
  )) {
    const ev = RACE_CATEGORIES[r.category];
    if (!ev) continue;
    for (const [self, partner] of [
      [r.player1, r.player2],
      [r.player2, r.player1],
    ] as const) {
      if (!self || !playerOf.has(self)) continue;
      (race[self] ??= []).push({
        ev,
        r: r.rank,
        pr: r.rank_previous,
        n: nameOf(self),
        w: nameOf(partner),
        pts: r.points,
      });
    }
  }
  write('race-rankings.json', { week: pubs.get(RACE)?.date ?? '', players: race });

  const rankingPlayerOf = new Map(
    all<RankingPlayerRow>(db, 'SELECT id, name, cc, photo FROM ranking_players').map((p) => [p.id, p]),
  );
  const rankedPerson = (id: string) => {
    const p = playerOf.get(id);
    const r = rankingPlayerOf.get(id);
    return {
      id,
      name: nameOf(id, r?.name),
      cc: p?.cc || r?.cc || '',
      photo: overrideImage(id, 'photo') ?? p?.photo ?? r?.photo ?? null,
      known: !!p,
    };
  };
  const finalsCity = editions.find((e) => e.season === currentYear && e.level === 'Finals' && e.city !== 'TBC')?.city;
  const raceName = finalsCity ? `HSBC Race to ${finalsCity}` : null;
  const tableName = (t: (typeof RANKING_TABLES)[number], published: string | null) =>
    (t.id === RACE ? raceName : published) ?? t.name;

  for (const t of RANKING_TABLES) {
    const pub = pubs.get(t.id);
    if (!pub) continue;
    const categories = Object.fromEntries(EventCode.options.map((ev) => [ev, [] as RankingRowDto[]])) as Record<
      EventCode,
      RankingRowDto[]
    >;
    for (const r of all<{
      category: number;
      player1: string;
      player2: string;
      rank: number;
      rank_previous: number | null;
      points: number;
      tournaments: number | null;
    }>(
      db,
      'SELECT category, player1, player2, rank, rank_previous, points, tournaments FROM rankings WHERE ranking = ? ORDER BY rank, points DESC, player1',
      t.id,
    )) {
      const ev = t.categories[r.category];
      if (!ev) continue;
      categories[ev].push({
        rank: r.rank,
        prev: r.rank_previous || null,
        points: r.points,
        tournaments: r.tournaments,
        players: [r.player1, r.player2].filter(Boolean).map(rankedPerson),
      });
    }
    write(`ranking-tables/${t.kind}.json`, {
      kind: t.kind,
      name: tableName(t, pub.name),
      publication: { id: pub.id, date: pub.date, week: pub.week },
      categories,
    });
  }

  const careerOf = (id: string) =>
    (byPlayer.get(id) ?? []).toSorted((a, b) => b.day.localeCompare(a.day) || b.dto.time.localeCompare(a.dto.time));
  const editionRef = (code: string): EditionRef | undefined => {
    const e = editionOf.get(code);
    return e && { code, slug: e.slug, name: e.series_name, year: e.season };
  };
  const retirementOf = (id: string): Retirement | undefined => {
    const since = MonthKey.safeParse(overrides[id]?.retired).data;
    if (!since) return undefined;
    const last = careerOf(id)[0];
    return { since, ...(last && { lastPlayed: last.day, lastTournament: editionRef(last.tournament) }) };
  };
  const retired = new Map(
    Object.keys(overrides).flatMap((id) => {
      const r = retirementOf(id);
      return r ? [[id, r] as const] : [];
    }),
  );

  write('players.json', {
    rankingsWeek: worldPub?.week ?? '',
    players: Object.fromEntries(
      players.map((p) => [
        p.id,
        {
          name: p.name,
          ...(p.name !== p.bwfName && { aka: p.bwfName }),
          cc: p.cc,
          ...(p.photo ? { photo: p.photo } : {}),
          ...(p.photo && overrides[p.id]?.photoCrop ? { photoCrop: overrides[p.id]?.photoCrop } : {}),
          ...(ranksOf.get(p.id)?.length ? { ranks: ranksOf.get(p.id) } : {}),
          retired: retired.get(p.id),
        },
      ]),
    ),
  });

  const credits = readCredits(path.dirname(overridesFile));
  write('image-credits.json', {
    credits: wikimediaImages(overrides)
      .flatMap(({ id, kind, source }) => {
        const credit = credits[source];
        const p = playerOf.get(id);
        return credit && p ? [{ id, name: p.name, cc: p.cc, kind, image: imageAssetPath(id, kind), ...credit }] : [];
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en')),
  });

  for (const p of players) {
    if (!full && !onlyPlayers?.has(p.id)) continue;
    const career = careerOf(p.id);
    write(`players/${p.id}.json`, {
      id: p.id,
      name: p.name,
      cc: p.cc,
      photo: p.photo,
      hero: p.hero,
      heroFocus: overrides[p.id]?.heroFocus ?? null,
      slug: p.slug,
      bio: bioOf(p),
      retired: retired.get(p.id),
      matches: career.map((c) => ({ tournament: c.tournament, day: c.day, ...c.dto })),
    });
  }

  const bestRank = new Map(
    all<{ id: string; best: number }>(
      db,
      `SELECT id, MIN(rank) AS best FROM (
         SELECT player1 AS id, rank FROM rankings WHERE ranking = ?
         UNION ALL SELECT player2, rank FROM rankings WHERE ranking = ? AND player2 != '')
       GROUP BY id`,
      WORLD,
      WORLD,
    ).map((r) => [r.id, r.best]),
  );
  const lastPlayed = new Map(
    all<{ id: string; last_played: string }>(db, 'SELECT id, last_played FROM players').map((r) => [
      r.id,
      r.last_played,
    ]),
  );
  const missing = players
    .filter((p) => !p.photo || !p.hero)
    .map((p) => ({ ...p, best: bestRank.get(p.id) ?? null, last: lastPlayed.get(p.id) ?? '' }))
    .sort((a, b) => (a.best ?? Infinity) - (b.best ?? Infinity) || b.last.localeCompare(a.last));
  const csv = (v: string) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  fs.writeFileSync(
    reportFile,
    [
      'name,country,has_avatar,has_hero,id',
      ...missing.map((p) => [p.name, p.cc, String(!!p.photo), String(!!p.hero), p.id].map(csv).join(',')),
    ].join('\n'),
  );

  if (missingAssets.length)
    console.warn(`  ! ${missingAssets.length} override images not built, BWF image used: ${missingAssets.join(', ')}`);
  console.log(
    `export: ${seasons.size} seasons · ${editions.length} editions · ${byEdition.size} tournament files · ${players.length} players · ${ranksOf.size} ranked · ${seriesEditions.size} series · ${missing.filter((p) => !p.photo).length} without photo · ${missing.filter((p) => !p.hero).length} without hero`,
  );
};
