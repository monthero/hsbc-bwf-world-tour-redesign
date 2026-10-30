import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { imageCreditsQuery, playerQuery, playersQuery, raceRankingsQuery, rankingHistoryQuery } from '~/api/queries';
import type { DirectoryRecord, Player, PlayerDirectory, PlayerRecord, PlayersData, Retirement } from '~/types';
import { weakCached } from '~/utils/cache';
import { toPlayer } from '~/utils/names';
import { playerPhoto, type PhotoOptions } from '~/utils/players';
import { playerStanding, searchKey, type PlayerStanding } from '~/utils/search';

export type { PlayerDirectory } from '~/types';

const selectDirectory = weakCached((d: PlayersData): PlayerDirectory => {
  const byId = new Map<string, DirectoryRecord>();
  for (const [id, rec] of Object.entries(d.players)) byId.set(id, { ...rec, id });
  return { week: d.rankingsWeek, get: (id) => byId.get(id) };
});

export const usePlayerDirectory = () => useQuery({ ...playersQuery(), select: selectDirectory });

export interface PlayerSearchEntry {
  player: Player;
  keys: readonly string[];
  standing: PlayerStanding;
  retired?: Retirement;
}

const searchEntry = (id: string, rec: PlayerRecord): PlayerSearchEntry => {
  const player = toPlayer(rec.name, rec.cc, id);
  const given = player.surnameFirst ? player.last : player.first;
  return {
    player,
    keys: [searchKey(rec.name), searchKey(player.surname), searchKey(given), ...(rec.aka ? [searchKey(rec.aka)] : [])],
    standing: playerStanding(rec.ranks),
    retired: rec.retired,
  };
};

const selectSearchIndex = weakCached((d: PlayersData): PlayerSearchEntry[] =>
  Object.entries(d.players).map(([id, rec]) => searchEntry(id, rec)),
);

export const usePlayerSearchIndex = (enabled: boolean) =>
  useQuery({ ...playersQuery(), select: selectSearchIndex, enabled });

export const useRaceRankings = () => useQuery(raceRankingsQuery());

export const useImageCredits = () => useQuery(imageCreditsQuery());

export const usePlayerFile = (id: string | undefined) => useQuery({ ...playerQuery(id ?? ''), enabled: !!id });

export const useRankingHistory = (playerId: string | undefined) =>
  useQuery({ ...rankingHistoryQuery(playerId ?? ''), enabled: !!playerId });

export const useHasPhoto = () => {
  const { data: dir } = usePlayerDirectory();
  return useCallback((p: Pick<Player, 'id'>) => !!dir?.get(p.id)?.photo, [dir]);
};

export const usePlayerPhoto = (id: string, opts?: PhotoOptions) => {
  const { data: dir } = usePlayerDirectory();
  return playerPhoto(dir, id, opts);
};
