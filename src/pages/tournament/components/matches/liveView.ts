import { t } from '@lingui/core/macro';

import type { LiveServer, MatchStats, SideStats } from '~/api/bwf/normalize';
import { EVENT_NAMES } from '~/constants';
import type { Game, Match, Side, Team } from '~/types';
import {
  challengesLeft,
  livePhase,
  liveStatus,
  pointCall,
  reviewBy,
  servingPlayer,
  STREAK_MIN,
  type ChallengeOutcome,
  type ChallengeResult,
  type LivePhase,
  type LiveStats,
  type LiveStatus,
} from '~/utils/live';
import { gameWon, matchRoundName, opposite } from '~/utils/matches';

export interface SideView {
  side: Side;
  team: Team;
  now: number;
  points: number;
  call: string | null;
  streak: number;
  serving: boolean;
  flash: boolean;
  leading: boolean;
  stats: SideStats | null;
  left: number | null;
  recent: ChallengeOutcome | null;
  review: boolean;
  result: string | null;
}

export interface LiveView {
  court: number;
  where: string;
  durationMin: number;
  games: readonly Game[];
  gameNo: number;
  status: LiveStatus | null;
  server: string | null;
  sides: readonly [SideView, SideView];
}

const resultOf = (phase: LivePhase, gameNo: number) => {
  if (phase === 'play') return null;
  return phase === 'over'
    ? t({ message: 'Won the match', comment: 'Live score chip next to the side that just won the match' })
    : t({
        message: `Won game ${gameNo}`,
        comment: 'Live score chip next to the side that just won a game. A badminton match is best of three games',
      });
};

const leftOf = (side: Side, gameNo: number, stats: LiveStats | null, game: MatchStats | null) => {
  const lost = game?.[side].challenges.lost ?? (gameNo === 1 ? stats?.sides[side].challenges.lost : undefined);
  return lost === undefined ? null : challengesLeft(lost);
};

const sideView = (
  m: Match,
  side: Side,
  stats: LiveStats | null,
  game: MatchStats | null,
  challenge: ChallengeResult | null,
  result: string | null,
): SideView => {
  const now = m.current?.[side] ?? 0;
  return {
    side,
    team: m.teams[side],
    now,
    points: m.games.reduce((x, g) => x + g[side], now),
    call: pointCall(m, side),
    streak: stats?.streak?.side === side && stats.streak.count >= STREAK_MIN ? stats.streak.count : 0,
    serving: m.serve === side + 1,
    flash: m.lastPoint === side + 1,
    leading: !!m.current && now > m.current[opposite(side)],
    stats: stats?.sides[side] ?? null,
    left: leftOf(side, m.games.length + 1, stats, game),
    recent: challenge?.side === side ? challenge.outcome : null,
    review: reviewBy(m) === side,
    result: m.current && gameWon(m.current, side) ? result : null,
  };
};

export const toLiveView = (
  m: Match,
  stats: LiveStats | null,
  game: MatchStats | null,
  challenge: ChallengeResult | null,
  server: LiveServer | undefined,
): LiveView => {
  const phase = livePhase(m);
  const gameNo = m.games.length + 1;
  const result = resultOf(phase, gameNo);
  return {
    court: m.court,
    where: `${EVENT_NAMES[m.event]} · ${matchRoundName(m)}`,
    durationMin: m.durationMin,
    games: m.games,
    gameNo,
    status: liveStatus(m),
    server: servingPlayer(m, server),
    sides: [sideView(m, 0, stats, game, challenge, result), sideView(m, 1, stats, game, challenge, result)],
  };
};
