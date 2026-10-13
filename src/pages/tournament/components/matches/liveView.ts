import type { LiveServer, SideStats } from '~/api/bwf/normalize';
import type { StatusTone } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { Game, Match, Side, Team } from '~/types';
import {
  livePhase,
  pointCall,
  reviewBy,
  STREAK_MIN,
  type ChallengeOutcome,
  type ChallengeResult,
  type LivePhase,
  type LiveStats,
} from '~/utils/live';
import { gameWon, matchRoundName, opposite } from '~/utils/matches';

export interface LiveChip {
  label: string;
  tone: StatusTone;
}

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
  status: LiveChip | null;
  server: string | null;
  sides: readonly [SideView, SideView];
}

const statusOf = (m: Match, phase: LivePhase, deciding: boolean): LiveChip | null => {
  if (phase === 'over') return { label: 'Match over', tone: 'green' };
  if (phase === 'between') return { label: 'Between games', tone: 'gold' };
  if (m.pause && reviewBy(m) === null) return { label: m.pause, tone: 'gold' };
  return deciding ? { label: 'Deciding game', tone: 'red' } : null;
};

const resultOf = (phase: LivePhase, gameNo: number) => {
  if (phase === 'play') return null;
  return phase === 'over' ? 'Won the match' : `Won game ${gameNo}`;
};

const sideView = (
  m: Match,
  side: Side,
  stats: LiveStats | null,
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
    recent: challenge?.side === side ? challenge.outcome : null,
    review: reviewBy(m) === side,
    result: m.current && gameWon(m.current, side) ? result : null,
  };
};

export const toLiveView = (
  m: Match,
  stats: LiveStats | null,
  challenge: ChallengeResult | null,
  server: LiveServer | undefined,
): LiveView => {
  const phase = livePhase(m);
  const gameNo = m.games.length + 1;
  const won = (s: Side) => m.games.filter((g) => gameWon(g, s)).length;
  const deciding = gameNo === 3 && won(0) === 1 && won(1) === 1;
  const result = resultOf(phase, gameNo);
  return {
    court: m.court,
    where: `${EVENT_NAMES[m.event]} · ${matchRoundName(m)}`,
    durationMin: m.durationMin,
    games: m.games,
    gameNo,
    status: statusOf(m, phase, deciding),
    server: phase === 'play' && server && m.serve === server.side + 1 ? server.id : null,
    sides: [sideView(m, 0, stats, challenge, result), sideView(m, 1, stats, challenge, result)],
  };
};
