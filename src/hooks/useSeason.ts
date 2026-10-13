import { useMemo } from 'react';

import type { CurrentRank, PlayerMatch, SeasonIndex } from '~/types';
import { toPlayer } from '~/utils/names';
import { buildBio } from '~/utils/players';
import { buildRanks, raceQualifiers } from '~/utils/rankings';
import { seasonIndexOf, seedOf } from '~/utils/season';

import { useCareerIndex } from './useCareer';
import { usePlayerDirectory, usePlayerFile, useRaceRankings } from './usePlayers';
import { useSeasonMatches } from './useTournaments';

const NO_MATCHES: PlayerMatch[] = [];
const NO_RANKS: CurrentRank[] = [];

const profileStatus = (found: boolean, loaded: boolean): 'loading' | 'missing' | 'ok' => {
  if (found) return 'ok';
  return loaded ? 'missing' : 'loading';
};

export const useSeasonIndex = (): SeasonIndex | undefined => {
  const { ready, matches } = useSeasonMatches();
  return useMemo(() => (ready ? seasonIndexOf(matches) : undefined), [ready, matches]);
};

export const usePlayerProfile = (id: string) => {
  const { data: directory } = usePlayerDirectory();
  const { data: race } = useRaceRankings();
  const file = usePlayerFile(id);
  const index = useSeasonIndex();
  const ids = useMemo(() => [id], [id]);
  const career = useCareerIndex(ids);
  const record = directory?.get(id);
  const indexed = career?.players.get(id) ?? index?.players.get(id);
  const matches = career?.matches.get(id) ?? NO_MATCHES;
  const rawName = record?.name ?? file.data?.name;
  const rawCc = record?.cc ?? file.data?.cc ?? '';

  const player = useMemo(
    () => indexed ?? (rawName === undefined ? undefined : toPlayer(rawName, rawCc, id)),
    [indexed, rawName, rawCc, id],
  );
  const rawBio = file.data?.bio;
  const bio = useMemo(() => buildBio(rawBio), [rawBio]);
  const qualifiers = useMemo(() => (race && index ? raceQualifiers(race, index) : undefined), [race, index]);
  const current = record?.ranks ?? NO_RANKS;
  const rankingId = current.length ? id : undefined;
  const raceRows = race?.players[id];
  const ranks = useMemo(
    () => buildRanks(current, raceRows, qualifiers, index, directory),
    [current, raceRows, qualifiers, index, directory],
  );
  const seed = useMemo(() => seedOf(matches), [matches]);

  return {
    status: profileStatus(!!player, !!directory && !file.isPending),
    player,
    record,
    profile: file.data,
    rankingId,
    matches,
    ready: !!career,
    index,
    bio,
    ranks,
    seed,
    week: directory?.week ?? '',
  };
};
