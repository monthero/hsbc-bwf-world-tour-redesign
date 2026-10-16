import type { z } from 'zod';

import {
  Calendar,
  NewsArticle,
  NewsIndex,
  NewsTournament,
  PlayerProfileDto,
  PlayersData,
  RankingTable,
  Seasons,
  type RankingKind,
} from '~/api/schemas';
import type { PlayerDirectory, Tournament } from '~/types';
import { toTournament } from '~/utils/tournaments';

type ReadJson = (file: string) => unknown;

const parse = <S extends z.ZodType>(readJson: ReadJson, file: string, schema: S): z.infer<S> | undefined => {
  const json = readJson(file);
  return json === undefined ? undefined : schema.safeParse(json).data;
};

const memo = <K, V>(load: (key: K) => V) => {
  const cache = new Map<K, V>();
  const get = (key: K) => {
    if (!cache.has(key)) cache.set(key, load(key));
    return cache.get(key) as V;
  };
  return Object.assign(get, { clear: () => cache.clear() });
};

const once = <V>(load: () => V) => {
  const cached = memo((_key: 0) => load());
  return Object.assign(() => cached(0), { clear: cached.clear });
};

export const createStore = (readJson: ReadJson) => {
  const read = <S extends z.ZodType>(file: string, schema: S) => parse(readJson, file, schema);
  const seasons = once(() => read('seasons.json', Seasons));
  const players = once(() => read('players.json', PlayersData));
  const directory = once((): PlayerDirectory => {
    const data = players();
    return {
      week: data?.rankingsWeek ?? '',
      get: (id) => {
        const record = data?.players[id];
        return record && { ...record, id };
      },
    };
  });
  const newsIndex = once(() => read('news/index.json', NewsIndex));
  const ranking = memo((kind: RankingKind) => read(`ranking-tables/${kind}.json`, RankingTable));
  const calendar = memo((year: number) => read(`calendar-${year}.json`, Calendar));
  const tournaments = memo((year: number): Tournament[] | undefined =>
    calendar(year)?.events.map((e, i) => toTournament(e, i)),
  );
  const byCode = once(
    () =>
      new Map((seasons()?.seasons ?? []).flatMap((s) => (tournaments(s.year) ?? []).map((t) => [t.code, t] as const))),
  );
  return {
    seasons,
    directory,
    newsIndex,
    ranking,
    tournaments,
    tournament: (code: string) => byCode().get(code),
    player: (id: string) => read(`players/${id}.json`, PlayerProfileDto),
    article: (id: string) => read(`news/articles/${id}.json`, NewsArticle),
    tournamentNews: (code: string) => read(`news/tournaments/${code}.json`, NewsTournament),
    resetLocale: () => {
      tournaments.clear();
      byCode.clear();
    },
  };
};

export type Store = ReturnType<typeof createStore>;
