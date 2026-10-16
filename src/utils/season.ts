import { msg, t } from '@lingui/core/macro';

import { ROUND_ORDER, SEASON_YEAR } from '~/constants';
import { translate } from '~/i18n/lazy';
import type {
  Match,
  MatchOutcome,
  PerspectiveGame,
  Player,
  PlayerDirectory,
  PlayerMatch,
  SeasonIndex,
  SeasonMatch,
  SeasonPhase,
  SeasonSummary,
  Side,
  Team,
  Tournament,
} from '~/types';

import { weakCached } from './cache';
import { allGames, opposite, teamEventKey } from './matches';
import { toPlayer } from './names';
import { finalsOf, isDone, isHeld, isLive, liveAndNext } from './tournaments';

const NO_TARGET: ReturnType<typeof liveAndNext> = { live: undefined, next: undefined };

const seasonPhase = (year: number): SeasonPhase => {
  if (year < SEASON_YEAR) return 'past';
  return year > SEASON_YEAR ? 'future' : 'current';
};

export const summarize = (list: Tournament[], year: number): SeasonSummary => {
  const held = list.filter(isHeld);
  const phase = seasonPhase(year);
  const current = phase === 'current';
  const { live, next } = current ? liveAndNext(held) : NO_TARGET;
  return {
    year,
    phase,
    total: held.length,
    done: held.filter(isDone).length,
    cancelled: list.length - held.length,
    liveCount: current ? held.filter(isLive).length : 0,
    live,
    next,
    target: live ?? next,
    finals: finalsOf(held),
  };
};

const DAYS_TO_GO = msg({
  message: '{count, plural, one {day to go} other {days to go}}',
  comment:
    'Countdown to the World Tour Finals, shown under a big number (the count is shown separately), e.g. "12" / "days to go"',
});

export const finalsCountdown = (tour: Tournament) => {
  if (tour.status === 'live')
    return {
      value: t({
        message: 'Live',
        context: 'tournament status',
        comment: 'Big status word: the Finals are being played now',
      }),
      label: t({
        message: 'Finals in progress',
        comment: 'The World Tour Finals, the season-ending tournament, are being played right now',
      }),
    };
  if (tour.status === 'done')
    return {
      value: '✓',
      label: t({ message: 'Season complete', comment: 'The World Tour season, including the Finals, has finished' }),
    };
  if (tour.status === 'cancelled')
    return {
      value: '—',
      label: t({ message: 'Cancelled', context: 'tournament status', comment: 'The tournament will not take place' }),
    };
  return { value: String(tour.daysUntil), label: translate(DAYS_TO_GO, { count: tour.daysUntil }) };
};

const outcomeOf = (m: Match, side: Side): MatchOutcome => {
  if (m.status === 'F') return m.winner === side + 1 ? 'W' : 'L';
  return m.status === 'P' ? 'Live' : 'up';
};

const pending = (pm: PlayerMatch) => Number(pm.outcome === 'up' || pm.outcome === 'Live');

const byRecency = (a: PlayerMatch, b: PlayerMatch) =>
  pending(b) - pending(a) ||
  b.match.date.localeCompare(a.match.date) ||
  (ROUND_ORDER[b.match.round] ?? 0) - (ROUND_ORDER[a.match.round] ?? 0) ||
  b.match.time.localeCompare(a.match.time);

const push = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
};

export const seasonIndexOf = weakCached((list: SeasonMatch[]): SeasonIndex => {
  const players = new Map<string, Player>();
  const matches = new Map<string, PlayerMatch[]>();
  const teams = new Map<string, PlayerMatch[]>();
  for (const { match, tournament } of list) {
    match.teams.forEach((team, i) => {
      if (!team.players.length) return;
      const side = i as Side;
      const entry: PlayerMatch = {
        key: `${tournament.code}:${match.id}`,
        match,
        tournament,
        side,
        outcome: outcomeOf(match, side),
      };
      push(teams, teamEventKey(match.event, team.key), entry);
      for (const p of team.players) {
        if (!players.has(p.id)) players.set(p.id, p);
        push(matches, p.id, entry);
      }
    });
  }
  for (const arr of matches.values()) arr.sort(byRecency);
  for (const arr of teams.values()) arr.sort(byRecency);
  return { players, matches, teams };
});

export const playerById = (
  id: string,
  name: string,
  index: SeasonIndex | undefined,
  dir: PlayerDirectory | undefined,
): Player => {
  const indexed = id ? index?.players.get(id) : undefined;
  if (indexed) return indexed;
  const rec = id ? dir?.get(id) : undefined;
  return rec ? toPlayer(rec.name, rec.cc, id) : toPlayer(name, '', '');
};

const gameResult = (me: number, opp: number): PerspectiveGame['state'] => (me > opp ? 'win' : 'loss');

export const perspectiveGames = (m: Match, side: Side): PerspectiveGame[] => {
  const opp = opposite(side);
  const live = m.current ? m.games.length : -1;
  return allGames(m).map((g, i) => ({
    key: i,
    me: g[side],
    opp: g[opp],
    state: i === live ? 'live' : gameResult(g[side], g[opp]),
  }));
};

export const ownTeam = (pm: PlayerMatch): Team => pm.match.teams[pm.side];

export const opponentsOf = (pm: PlayerMatch): Player[] => pm.match.teams[opposite(pm.side)].players;

export const seedOf = (matches: readonly PlayerMatch[]) => {
  const pm = matches.find((x) => x.tournament.status === 'live' && ownTeam(x).seed);
  return pm ? ownTeam(pm).seed : null;
};

const decided = (pm: PlayerMatch) => pm.outcome === 'W' || pm.outcome === 'L';

export const recentForm = (list: readonly PlayerMatch[], limit: number) =>
  list.filter(decided).slice(0, limit).reverse();

export const winLoss = (list: readonly PlayerMatch[]) => {
  let w = 0;
  let l = 0;
  for (const pm of list) {
    if (pm.outcome === 'W') w++;
    else if (pm.outcome === 'L') l++;
  }
  return [w, l] as const;
};
