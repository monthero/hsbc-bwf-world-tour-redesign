import { useMemo } from 'react';
import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Continent, EventCode, Level } from '~/api/schemas';
import { SEASON_YEAR } from '~/constants';
import { continentOf } from '~/utils/countries';

import { safeJSONStorage } from './persistence';

export type FavoriteKind = 'player' | 'country' | 'continent' | 'discipline' | 'tournament' | 'level';

export const FOLLOW_KINDS = ['player', 'country', 'continent'] as const;

const STORAGE_KEY = 'bwf-favorites';
const STORE_VERSION = 2;

const stamp = { addedAt: z.number() };
const Stamp = z.object(stamp);

export const PlayerFavorite = z.object({ ...stamp, name: z.string(), cc: z.string() });
export type PlayerFavorite = z.infer<typeof PlayerFavorite>;

export const TournamentFavorite = z.object({
  ...stamp,
  name: z.string(),
  slug: z.string(),
  year: z.number().catch(SEASON_YEAR),
});
export type TournamentFavorite = z.infer<typeof TournamentFavorite>;

export const FavoritesData = z.object({
  players: z.record(z.string(), PlayerFavorite).catch({}),
  countries: z.record(z.string(), Stamp).catch({}),
  continents: z.partialRecord(Continent, Stamp).catch({}),
  disciplines: z.partialRecord(EventCode, Stamp).catch({}),
  tournaments: z.record(z.string(), TournamentFavorite).catch({}),
  levels: z.partialRecord(Level, Stamp).catch({}),
});
export type FavoritesData = z.infer<typeof FavoritesData>;
export type FavoritePlayerRef = { id: string; name: string; cc: string };

type FavoriteIds = {
  player: string;
  country: string;
  continent: Continent;
  discipline: EventCode;
  tournament: string;
  level: Level;
};
type FavoriteMetas = {
  player: { name: string; cc: string };
  tournament: { name: string; slug: string; year: number };
};
export type FavoriteId<K extends FavoriteKind> = FavoriteIds[K];
export type FavoriteMeta<K extends FavoriteKind> = K extends keyof FavoriteMetas ? FavoriteMetas[K] : never;
type MetaArgs<K extends FavoriteKind> = K extends keyof FavoriteMetas ? [meta: FavoriteMetas[K]] : [];

export interface FavoritesActions {
  toggle: <K extends FavoriteKind>(kind: K, id: FavoriteId<K>, ...meta: MetaArgs<K>) => void;
  add: <K extends FavoriteKind>(kind: K, id: FavoriteId<K>, ...meta: MetaArgs<K>) => void;
  remove: <K extends FavoriteKind>(kind: K, id: FavoriteId<K>) => void;
  clear: (kind?: FavoriteKind) => void;
  togglePlayers: (players: readonly FavoritePlayerRef[]) => void;
}

export type FavoritesState = FavoritesData & FavoritesActions;

const BUCKET = {
  player: 'players',
  country: 'countries',
  continent: 'continents',
  discipline: 'disciplines',
  tournament: 'tournaments',
  level: 'levels',
} as const satisfies Record<FavoriteKind, keyof FavoritesData>;

const KINDS = Object.keys(BUCKET) as FavoriteKind[];

type Bucket = Record<string, object | undefined>;

const bucketOf = (s: FavoritesData, kind: FavoriteKind) => s[BUCKET[kind]] as Bucket;

const emptyData = (): FavoritesData => ({
  players: {},
  countries: {},
  continents: {},
  disciplines: {},
  tournaments: {},
  levels: {},
});

const parseData = (raw: unknown): FavoritesData => {
  const parsed = FavoritesData.safeParse(raw);
  return parsed.success ? parsed.data : emptyData();
};

const migrate = (persisted: unknown, version: number) =>
  (version < STORE_VERSION && persisted && typeof persisted === 'object'
    ? { ...persisted, players: {} }
    : persisted) as FavoritesData;

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => {
      const add = (kind: FavoriteKind, id: string, meta?: object) =>
        set((s) => {
          const bucket = bucketOf(s, kind);
          const prev = bucket[id];
          if (prev && !meta) return s;
          return { [BUCKET[kind]]: { ...bucket, [id]: { addedAt: Date.now(), ...prev, ...meta } } };
        });
      const remove = (kind: FavoriteKind, id: string) =>
        set((s) => {
          const bucket = bucketOf(s, kind);
          if (!bucket[id]) return s;
          const next = { ...bucket };
          delete next[id];
          return { [BUCKET[kind]]: next };
        });
      return {
        ...emptyData(),
        add: (kind, id, ...meta) => add(kind, id, meta[0]),
        remove,
        toggle: (kind, id, ...meta) => (bucketOf(get(), kind)[id] ? remove(kind, id) : add(kind, id, meta[0])),
        clear: (kind) => set(kind ? { [BUCKET[kind]]: {} } : emptyData()),
        togglePlayers: (players) => {
          if (!players.length) return;
          set((s) => {
            const next = { ...s.players };
            const all = players.every((p) => next[p.id]);
            const addedAt = Date.now();
            for (const { id, name, cc } of players) {
              if (all) delete next[id];
              else next[id] = { addedAt, ...next[id], name, cc };
            }
            return { players: next };
          });
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: safeJSONStorage<FavoritesData>(),
      partialize: (s): FavoritesData => ({
        players: s.players,
        countries: s.countries,
        continents: s.continents,
        disciplines: s.disciplines,
        tournaments: s.tournaments,
        levels: s.levels,
      }),
      migrate,
      merge: (persisted, current) => ({ ...current, ...parseData(persisted) }),
    },
  ),
);

export const useIsFavorite = (kind: FavoriteKind, id: string): boolean =>
  useFavorites((s) => bucketOf(s, kind)[id] !== undefined);

export const useIsPlayerFavorite = (id: string): boolean => useIsFavorite('player', id);

export const useArePlayersFavorite = (ids: readonly string[]): boolean =>
  useFavorites((s) => ids.length > 0 && ids.every((id) => s.players[id] !== undefined));

export const useFavoriteCount = (kind?: FavoriteKind | readonly FavoriteKind[]): number =>
  useFavorites((s) => {
    const kinds = kind === undefined ? KINDS : [kind].flat();
    return kinds.reduce((n, k) => n + Object.keys(bucketOf(s, k)).length, 0);
  });

const impliedBy = (s: Pick<FavoritesData, 'countries' | 'continents'>, cc: string) =>
  cc !== '' && (s.countries[cc] !== undefined || s.continents[continentOf(cc)] !== undefined);

export const useIsImpliedFavorite = (players: readonly { cc: string }[]): boolean =>
  useFavorites((s) => players.some((p) => impliedBy(s, p.cc)));

export const useFavoritesMatcher = (): ((players: readonly { id: string; cc: string }[]) => boolean) => {
  const { players, countries, continents } = useFavorites(
    useShallow((s) => ({ players: s.players, countries: s.countries, continents: s.continents })),
  );
  return useMemo(() => {
    const follows = { countries, continents };
    return (list) => list.some((p) => players[p.id] !== undefined || impliedBy(follows, p.cc));
  }, [players, countries, continents]);
};
