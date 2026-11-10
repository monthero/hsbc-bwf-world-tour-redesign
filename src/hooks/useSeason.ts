import { useMemo } from 'react';

import { useHeightUnit, useTensionUnit } from '~/stores/settings';
import type { CurrentRank, PlayerMatch } from '~/types';
import { toPlayer } from '~/utils/names';
import { buildBio } from '~/utils/players';
import { buildRanks, raceQualifiers } from '~/utils/rankings';
import { seedOf } from '~/utils/season';

import { useCareerIndex } from './useCareer';
import { usePlayerDirectory, usePlayerFile, useRaceRankings } from './usePlayers';

const NO_MATCHES: PlayerMatch[] = [];
const NO_RANKS: CurrentRank[] = [];

const profileStatus = (found: boolean, loaded: boolean): 'loading' | 'missing' | 'ok' => {
  if (found) return 'ok';
  return loaded ? 'missing' : 'loading';
};

export const usePlayerProfile = (id: string) => {
  const { data: directory } = usePlayerDirectory();
  const { data: race } = useRaceRankings();
  const file = usePlayerFile(id);
  const ids = useMemo(() => [id], [id]);
  const career = useCareerIndex(ids);
  const record = directory?.get(id);
  const indexed = career?.players.get(id);
  const matches = career?.matches.get(id) ?? NO_MATCHES;
  const rawName = record?.name ?? file.data?.name;
  const rawCc = record?.cc ?? file.data?.cc ?? '';

  const player = useMemo(
    () => indexed ?? (rawName === undefined ? undefined : toPlayer(rawName, rawCc, id)),
    [indexed, rawName, rawCc, id],
  );
  const rawBio = file.data?.bio;
  const height = useHeightUnit();
  const tension = useTensionUnit();
  const bio = useMemo(() => buildBio(rawBio, { height, tension }), [rawBio, height, tension]);
  const qualifiers = useMemo(
    () => (race && directory ? raceQualifiers(race, directory) : undefined),
    [race, directory],
  );
  const current = record?.ranks ?? NO_RANKS;
  const rankingId = current.length ? id : undefined;
  const raceRows = race?.players[id];
  const ranks = useMemo(
    () => buildRanks(current, raceRows, qualifiers, career, directory),
    [current, raceRows, qualifiers, career, directory],
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
    index: career,
    bio,
    ranks,
    seed,
    retired: record?.retired ?? file.data?.retired,
    week: directory?.week ?? '',
  };
};
