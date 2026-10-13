import { useMemo } from 'react';

import { SEASON_YEAR } from '~/constants';
import type { Tournament } from '~/types';
import { byStanding, parseQuery, rankHits, searchKey } from '~/utils/search';

import { usePlayerSearchIndex, type PlayerSearchEntry } from './usePlayers';
import { useAllTournaments } from './useTournaments';

const PLAYER_LIMIT = 6;
const TOURNAMENT_LIMIT = 5;

interface TournamentEntry {
  tournament: Tournament;
  keys: readonly string[];
}

export interface SiteSearchResults {
  players: PlayerSearchEntry[];
  tournaments: TournamentEntry[];
}

const EMPTY: SiteSearchResults = { players: [], tournaments: [] };

const toEntry = (t: Tournament): TournamentEntry => ({
  tournament: t,
  keys: [searchKey(t.title, t.city, t.country, t.levelLabel), searchKey(t.name), searchKey(t.city)],
});

const byPlayerRelevance = (a: PlayerSearchEntry, b: PlayerSearchEntry) => byStanding(a.standing, b.standing);

const seasonOrder = (t: Tournament) => (t.year === SEASON_YEAR ? 0 : 1);

const byTournamentRelevance = ({ tournament: a }: TournamentEntry, { tournament: b }: TournamentEntry) =>
  seasonOrder(a) - seasonOrder(b) || b.year - a.year || Math.abs(a.daysUntil) - Math.abs(b.daysUntil);

export const useSiteSearch = (query: string, enabled: boolean) => {
  const { data: players } = usePlayerSearchIndex(enabled);
  const all = useAllTournaments(enabled);
  const tournaments = useMemo(() => all.map(toEntry), [all]);
  const q = useMemo(() => parseQuery(query), [query]);
  const results = useMemo(
    () =>
      q.terms.length
        ? {
            players: rankHits(players ?? [], q, byPlayerRelevance, PLAYER_LIMIT),
            tournaments: rankHits(tournaments, q, byTournamentRelevance, TOURNAMENT_LIMIT),
          }
        : EMPTY,
    [players, tournaments, q],
  );
  return { results, ready: !!players, searching: q.terms.length > 0 };
};
