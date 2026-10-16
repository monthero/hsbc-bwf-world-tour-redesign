import { msg, t } from '@lingui/core/macro';

import type { LiveServer, MatchStats } from '~/api/bwf/normalize';
import { lazyRecord, translate } from '~/i18n/lazy';
import type { Game, Match, Side } from '~/types';

import { labelValue } from './format';
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

export const CHALLENGE_LABELS: Record<ChallengeOutcome, string> = lazyRecord({
  won: msg({
    message: 'Challenge won',
    comment:
      'Live match tag: the video review proved the player right. A challenge is a player’s request for a video review of a line call (Instant Review)',
  }),
  lost: msg({
    message: 'Challenge lost',
    comment:
      'Live match tag: the video review proved the player wrong. A challenge is a player’s request for a video review of a line call (Instant Review)',
  }),
  void: msg({
    message: 'Challenge · no decision',
    comment:
      'Live match tag: the video review could not decide the call. A challenge is a player’s request for a video review of a line call (Instant Review)',
  }),
});

export const CHALLENGES_PER_GAME = 2;

export const challengesLeft = (lost: number) => Math.max(0, CHALLENGES_PER_GAME - lost);

export const CHALLENGE_RULE = msg({
  message: 'This game · only unsuccessful challenges use one up',
  comment:
    'Explains the challenge count: it resets each game, and a challenge is only used up when it fails. A challenge is a player’s request for a video review of a line call (Instant Review)',
});

const CHALLENGE_HEADLINE = msg({
  message: '{left} of {total, plural, one {# challenge} other {# challenges}} left',
  comment:
    'Live match: how many challenges a side can still make in this game, e.g. "1 of 2 challenges left". A challenge is a player’s request for a video review of a line call (Instant Review)',
});

export const challengeHeadline = (left: number) => translate(CHALLENGE_HEADLINE, { left, total: CHALLENGES_PER_GAME });

export const challengeRows = ({ challenges: c }: MatchStats[number]) => [
  {
    label: t({
      message: 'Used this match',
      comment:
        'Live match: number of challenges a side has made. A challenge is a player’s request for a video review of a line call (Instant Review)',
    }),
    value: c.used,
  },
  {
    label: t({
      message: 'Won',
      context: 'challenges',
      comment:
        'Live match: number of successful challenges. A challenge is a player’s request for a video review of a line call (Instant Review)',
    }),
    value: c.won,
  },
  {
    label: t({
      message: 'Lost',
      context: 'challenges',
      comment:
        'Live match: number of failed challenges. A challenge is a player’s request for a video review of a line call (Instant Review)',
    }),
    value: c.lost,
  },
];

export const challengeTip = (s: MatchStats[number], left: number) =>
  [challengeHeadline(left), ...challengeRows(s).map((r) => labelValue(r.label, r.value))].join(' · ');

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

export interface LiveStatus {
  label: string;
  tone: 'green' | 'gold' | 'blue';
}

const gamesWon = (m: Match, side: Side) => m.games.filter((g) => gameWon(g, side)).length;

export const liveStatus = (m: Match): LiveStatus | null => {
  const phase = livePhase(m);
  if (phase === 'over')
    return {
      label: t({ message: 'Match over', comment: 'Live match status: the last rally has been played' }),
      tone: 'green',
    };
  if (phase === 'between')
    return {
      label: t({ message: 'Between games', comment: 'Live match status: the break between two games of a match' }),
      tone: 'gold',
    };
  if (m.pause && reviewBy(m) === null) return { label: m.pause, tone: 'gold' };
  const deciding = m.games.length === 2 && gamesWon(m, 0) === 1 && gamesWon(m, 1) === 1;
  if (!deciding) return null;
  return {
    label: t({
      message: 'Deciding game',
      comment: 'Live match status: the third game, played when each side has won one game; its winner wins the match',
    }),
    tone: 'blue',
  };
};

export const servingPlayer = (m: Match, server: LiveServer | undefined) =>
  livePhase(m) === 'play' && server && m.serve === server.side + 1 ? server.id : null;

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
  return m.games.some((x) => gameWon(x, side))
    ? t({
        message: 'Match point',
        comment: 'Live match: this side wins the whole match if it wins the next rally',
      })
    : t({ message: 'Game point', comment: 'Live match: this side wins the current game if it wins the next rally' });
};
