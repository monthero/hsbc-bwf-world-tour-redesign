import { t } from '@lingui/core/macro';

import type { LiveServer, MatchStats, SideStats } from '~/api/bwf/normalize';
import { EVENT_NAMES } from '~/constants';
import type { Game, Match, Side, Team } from '~/types';
import {
  challengesLeft,
  gameDone,
  livePhase,
  liveStatus,
  pointCall,
  pointCallKind,
  reviewBy,
  receivingPlayer,
  servingPlayer,
  STREAK_MIN,
  type ChallengeOutcome,
  type CallKind,
  type ChallengeResult,
  type LivePhase,
  type LiveStats,
  type LiveStatus,
} from '~/utils/live';
import { allGames, gameWon, matchRoundName, noteLabel, opposite, winnerSide } from '~/utils/matches';

import { medalStake, type MedalStake } from '../medals';

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
  event: string;
  round: string;
  durationMin: number;
  games: readonly Game[];
  gameNo: number;
  status: LiveStatus | null;
  server: string | null;
  receiver: string | null;
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
    leading: !!m.current && gameDone(m.current) && gameWon(m.current, side),
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
  receiver: string | null = null,
): LiveView => {
  const phase = livePhase(m);
  const gameNo = m.games.length + 1;
  const result = resultOf(phase, gameNo);
  return {
    court: m.court,
    event: EVENT_NAMES[m.event],
    round: matchRoundName(m),
    durationMin: m.durationMin,
    games: m.games,
    gameNo,
    status: liveStatus(m),
    server: servingPlayer(m, server),
    receiver: receivingPlayer(m, server, receiver),
    sides: [sideView(m, 0, stats, game, challenge, result), sideView(m, 1, stats, game, challenge, result)],
  };
};

export type ShowdownPhase = 'pre' | LivePhase;

export interface ShowdownView {
  match: Match;
  live: LiveView;
  phase: ShowdownPhase;
  onCourt: boolean;
  label: string | null;
  note: string | null;
  score: Game | null;
  done: readonly Game[];
  winner: Side | null;
  stake: MedalStake | null;
  status: LiveStatus | null;
  calls: readonly [CallKind | null, CallKind | null];
}

const SIDES = [0, 1] as const;
const GAMES_TO_WIN = 2;

const waiting = (m: Match) => m.status === 'P' && !m.games.length && !m.current?.[0] && !m.current?.[1];

const phaseOf = (m: Match): ShowdownPhase => {
  if (m.status === 'N' || waiting(m)) return 'pre';
  if (m.status === 'F') return 'over';
  return livePhase(m);
};

const doneGames = (m: Match, phase: ShowdownPhase) => {
  if (phase === 'pre') return [];
  return m.current && !gameDone(m.current) ? m.games : allGames(m);
};

const winnerOf = (m: Match, phase: ShowdownPhase, done: readonly Game[]): Side | null => {
  if (phase !== 'over') return null;
  if (m.status === 'F') return winnerSide(m);
  return SIDES.find((s) => gamesWon(done, s) >= GAMES_TO_WIN) ?? null;
};

const hubLabel = (phase: ShowdownPhase, game: number, score: Game | null, note: string | null) => {
  if (note) return noteLabel(note, 'long');
  if (phase === 'play')
    return t({
      message: `Game ${game}`,
      comment: 'Live score: the game being played, e.g. “Game 2”. A badminton match is best of three games',
    });
  if (phase === 'between') {
    const next = game + 1;
    return t({
      message: `Game ${next} next`,
      comment: 'Live score during the break between games: the game about to start, e.g. “Game 3 next”',
    });
  }
  if (phase === 'over' && score)
    return t({
      message: 'Final score',
      comment: 'Label above the score of the last game once a match has finished',
    });
  return null;
};

const gamesWon = (done: readonly Game[], side: Side) => done.filter((g) => gameWon(g, side)).length;

const scoreOf = (m: Match, phase: ShowdownPhase, done: readonly Game[], note: string | null): Game | null => {
  if (note) return null;
  if (phase === 'play') return m.current;
  return phase === 'over' && done.length ? [gamesWon(done, 0), gamesWon(done, 1)] : null;
};

export const toShowdownView = (m: Match, live: LiveView): ShowdownView => {
  const phase = phaseOf(m);
  const onCourt = m.status === 'P';
  const done = doneGames(m, phase);
  const note = phase === 'over' && noteLabel(m.note, 'short') ? m.note : null;
  const score = scoreOf(m, phase, done, note);
  return {
    match: m,
    live,
    phase,
    onCourt,
    label: hubLabel(phase, live.gameNo, score, note),
    note,
    score,
    done,
    winner: winnerOf(m, phase, done),
    stake: phase === 'over' ? null : medalStake(m.round),
    status: onCourt && (phase === 'play' || phase === 'pre') ? live.status : null,
    calls: [pointCallKind(m, 0), pointCallKind(m, 1)],
  };
};

export const trailsIn = (score: Game | null, side: Side) => !!score && score[side] < score[opposite(side)];
