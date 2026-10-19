import fs from 'node:fs';
import path from 'node:path';

import { byNewest } from '../../server/news.ts';
import {
  type MatchDto,
  type MediaItem,
  NewsBrief,
  type NewsItem,
  type PlayerMedia,
  type PlayerMediaIndex,
  type PlayerVideo,
  TournamentMatches,
  TournamentMedia,
} from '../../src/api/schemas.ts';
import { linkMedia, type LinkMatch } from '../../src/utils/media-link.ts';
import { surnameOf } from '../../src/utils/surname.ts';
import { all, type Db } from './db.ts';
import type { Output } from './output.ts';
import { push, readJsonFile } from './util.ts';

const LINKS_SQL = `
SELECT player_id AS player, news_id AS id FROM news_players
UNION
SELECT j.value, a.id FROM news_articles a, json_each(a.article, '$.matchedPlayers') j
`;

interface DtoMatch extends LinkMatch {
  dto: MatchDto;
}

const toTeam = (t: MatchDto['teams'][number]) => ({
  players: t.players.map((p) => ({ id: p.id, name: p.name, surname: surnameOf(p.name) })),
});

const matchesOf = (file: string): DtoMatch[] => {
  const parsed = TournamentMatches.safeParse(readJsonFile<unknown>(file, null));
  if (!parsed.success) return [];
  return Object.entries(parsed.data.days).flatMap(([day, list]) =>
    list.map((dto, i) => ({
      id: `${day}-${i}`,
      code: dto.code ?? null,
      round: dto.round,
      teams: [toTeam(dto.teams[0]), toTeam(dto.teams[1])],
      dto,
    })),
  );
};

const refsOf = (item: MediaItem, m: MatchDto, code: string) => {
  const [a, b] = m.teams;
  const sides = [
    [a, b],
    [b, a],
  ] as const;
  return sides.flatMap(([self, other]) =>
    self.players.map((p) => ({
      player: p.id,
      video: {
        ...item,
        round: m.round,
        tournament: code,
        event: m.event,
        opponents: other.players.map((o) => o.id),
      },
    })),
  );
};

const tournamentRefs = (file: string, dataDir: string) => {
  const media = TournamentMedia.safeParse(readJsonFile<unknown>(file, null));
  if (!media.success) return [];
  const { code, items } = media.data;
  const { matchOf } = linkMedia(items, matchesOf(path.join(dataDir, `tournaments/${code}.json`)));
  return items.flatMap((item) => {
    const m = matchOf.get(item.id)?.dto;
    return m ? refsOf(item, m, code) : [];
  });
};

const videosByPlayer = (mediaDir: string, dataDir: string) => {
  const out = new Map<string, PlayerVideo[]>();
  const files = fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir).filter((f) => f.endsWith('.json')) : [];
  for (const { player, video } of files.flatMap((f) => tournamentRefs(path.join(mediaDir, f), dataDir)))
    push(out, player, video);
  for (const list of out.values()) list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return out;
};

const newsByPlayer = (db: Db) => {
  const playersOf = new Map<string, string[]>();
  for (const { player, id } of all<{ player: string; id: number }>(db, LINKS_SQL)) push(playersOf, String(id), player);
  const out = new Map<string, NewsBrief[]>();
  const items = all<{ item: string }>(db, 'SELECT item FROM news')
    .map((r) => JSON.parse(r.item) as NewsItem)
    .sort(byNewest);
  for (const item of items) {
    const brief = NewsBrief.parse(item);
    for (const p of playersOf.get(item.id) ?? []) push(out, p, brief);
  }
  return out;
};

export const exportPlayerMedia = (db: Db, output: Output, dataDir: string, mediaDir: string) => {
  const news = newsByPlayer(db);
  const videos = videosByPlayer(mediaDir, dataDir);
  const counts: PlayerMediaIndex['counts'] = {};
  let bytes = 0;
  for (const { id } of all<{ id: string }>(db, 'SELECT id FROM players ORDER BY id')) {
    const media: PlayerMedia = { id, news: news.get(id) ?? [], videos: videos.get(id) ?? [] };
    if (!media.news.length && !media.videos.length) continue;
    const json = JSON.stringify(media);
    output.write(`player-media/${id}.json`, json);
    bytes += json.length;
    counts[id] = [media.news.length, media.videos.length];
  }
  output.write('player-media/index.json', JSON.stringify({ counts } satisfies PlayerMediaIndex));
  const players = Object.values(counts);
  console.log(
    `export player media: ${players.length} players · ${players.filter(([n]) => n).length} with news · ${players.filter(([, v]) => v).length} with videos (${players.reduce((t, [, v]) => t + v, 0)} refs) · ${(bytes / 1e6).toFixed(1)} MB`,
  );
};
