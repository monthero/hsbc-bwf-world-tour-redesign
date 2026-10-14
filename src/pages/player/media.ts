import type { MediaItem, PlayerVideo } from '~/api/schemas';
import type { Match, PlayerMatch, Tournament } from '~/types';
import { date } from '~/utils/dates';
import { compareText } from '~/utils/names';
import type { BriefStory } from '~/utils/news';
import { opponentsOf } from '~/utils/season';

import { NEWS_GROUP_MIN } from './constants';

export interface VideoEntry {
  item: MediaItem;
  code: string;
  match: Match | undefined;
  tournament: Tournament | undefined;
}

export interface VideoGroup {
  key: string;
  tournament: Tournament | undefined;
  entries: VideoEntry[];
}

export interface NewsGroup {
  key: string;
  label: string | null;
  stories: BriefStory[];
}

const matchKey = (code: string, event: string, round: string, opponents: readonly string[]) =>
  [code, event, round, opponents.toSorted(compareText).join('/')].join('|');

const keyOfPlayerMatch = (pm: PlayerMatch) =>
  matchKey(
    pm.tournament.code,
    pm.match.event,
    pm.match.round,
    opponentsOf(pm).map((p) => p.id),
  );

export const indexPlayerMatches = (matches: readonly PlayerMatch[]) =>
  new Map(matches.map((pm) => [keyOfPlayerMatch(pm), pm]));

export const archivedVideos = (
  videos: readonly PlayerVideo[],
  index: ReadonlyMap<string, PlayerMatch>,
  byCode: ReadonlyMap<string, Tournament> | undefined,
): VideoEntry[] =>
  videos.map((v) => {
    const pm = index.get(matchKey(v.tournament, v.event, v.round ?? '', v.opponents));
    return { item: v, code: v.tournament, match: pm?.match, tournament: pm?.tournament ?? byCode?.get(v.tournament) };
  });

const plays = (match: Match, playerId: string) => match.teams.some((t) => t.players.some((p) => p.id === playerId));

export const liveVideos = (
  items: readonly MediaItem[],
  matchOf: ReadonlyMap<string, Match>,
  playerId: string,
  t: Tournament,
): VideoEntry[] =>
  items.flatMap((item) => {
    const match = matchOf.get(item.id);
    return match && plays(match, playerId) ? [{ item, code: t.code, match, tournament: t }] : [];
  });

export const mergeVideos = (...lists: (readonly VideoEntry[])[]) =>
  [...new Map(lists.flat().map((e) => [e.item.id, e])).values()].sort((a, b) =>
    b.item.publishedAt.localeCompare(a.item.publishedAt),
  );

export const groupVideos = (entries: readonly VideoEntry[]): VideoGroup[] =>
  [...Map.groupBy(entries, (e) => e.code)].map(([key, list]) => ({
    key,
    tournament: list[0]?.tournament,
    entries: list,
  }));

export const groupNews = (stories: readonly BriefStory[], total: number): NewsGroup[] => {
  if (total < NEWS_GROUP_MIN) return [{ key: 'all', label: null, stories: [...stories] }];
  return [...Map.groupBy(stories, (s) => String(date(s.item.publishedAt).year()))].map(([year, list]) => ({
    key: year,
    label: year,
    stories: list,
  }));
};
