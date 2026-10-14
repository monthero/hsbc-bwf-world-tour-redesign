import type { MatchStats } from '~/api/bwf/normalize';
import type { Game, Match, Side } from '~/types';

import { gameWon, opposite } from './matches';

export type ChallengeOutcome = 'won' | 'lost' | 'void';

export interface ChallengeResult {
  side: Side;
  outcome: ChallengeOutcome;
  at: number;
}

export interface Streak {
  side: Side;
  count: number;
}

export interface LiveStats {
  sides: MatchStats;
  streak: Streak | null;
  challenge: ChallengeResult | null;
}

export const STREAK_MIN = 3;

export const CHALLENGE_LABELS: Record<ChallengeOutcome, string> = {
  won: 'Challenge won',
  lost: 'Challenge lost',
  void: 'Challenge · no decision',
};

export const CHALLENGES_PER_GAME = 2;

export const challengesLeft = (lost: number) => Math.max(0, CHALLENGES_PER_GAME - lost);

export const CHALLENGE_RULE = 'This game · only unsuccessful challenges use one up';

export const challengeHeadline = (left: number) => `${left} of ${CHALLENGES_PER_GAME} challenges left`;

export const challengeRows = ({ challenges: c }: MatchStats[number]) => [
  { label: 'Used this match', value: c.used },
  { label: 'Won', value: c.won },
  { label: 'Lost', value: c.lost },
];

export const challengeTip = (s: MatchStats[number], left: number) =>
  [challengeHeadline(left), ...challengeRows(s).map((r) => `${r.label}: ${r.value}`)].join(' · ');

const SIDES: readonly Side[] = [0, 1];

const GAME_TO = 21;
const GAME_CAP = 30;
const GAMES_TO_WIN = 2;

export const gameDone = (g: Game) => {
  const hi = Math.max(g[0], g[1]);
  return hi >= GAME_CAP || (hi >= GAME_TO && hi - Math.min(g[0], g[1]) >= 2);
};

export type LivePhase = 'play' | 'between' | 'over';

export const livePhase = (m: Match): LivePhase => {
  const g = m.current;
  if (!g || !gameDone(g)) return 'play';
  const all = [...m.games, g];
  return SIDES.some((s) => all.filter((x) => gameWon(x, s)).length >= GAMES_TO_WIN) ? 'over' : 'between';
};

export const reviewBy = (m: Match): Side | null =>
  m.review && m.lastPoint ? opposite(m.lastPoint === 1 ? 0 : 1) : null;

const nextStreak = (prev: LiveStats, sides: MatchStats): Streak | null => {
  const a = sides[0].ralliesWon - prev.sides[0].ralliesWon;
  const b = sides[1].ralliesWon - prev.sides[1].ralliesWon;
  if (a < 0 || b < 0 || (a > 0 && b > 0)) return null;
  if (!a && !b) return prev.streak;
  const side: Side = a > 0 ? 0 : 1;
  return { side, count: (prev.streak?.side === side ? prev.streak.count : 0) + a + b };
};

const outcomeOf = (won: number, lost: number): ChallengeOutcome => {
  if (won > 0) return 'won';
  return lost > 0 ? 'lost' : 'void';
};

const nextChallenge = (prev: LiveStats, sides: MatchStats, at: number): ChallengeResult | null => {
  for (const side of SIDES) {
    const p = prev.sides[side].challenges;
    const n = sides[side].challenges;
    if (n.used > p.used || n.won > p.won || n.lost > p.lost)
      return { side, outcome: outcomeOf(n.won - p.won, n.lost - p.lost), at };
  }
  return prev.challenge;
};

export const trackLiveStats = (prev: LiveStats | null | undefined, sides: MatchStats, at: number): LiveStats =>
  prev
    ? { sides, streak: nextStreak(prev, sides), challenge: nextChallenge(prev, sides, at) }
    : { sides, streak: null, challenge: null };

const hasGamePoint = (own: number, opp: number) => own >= GAME_TO - 1 && (own > opp || own === GAME_CAP - 1);

export const pointCall = (m: Match, side: Side) => {
  const g = m.current;
  if (!g || gameDone(g) || !hasGamePoint(g[side], g[opposite(side)])) return null;
  return m.games.some((x) => gameWon(x, side)) ? 'Match point' : 'Game point';
};
