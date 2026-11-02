import { msg, t } from '@lingui/core/macro';

import type { LiveServer, MatchStats } from '~/api/bwf/normalize';
import { lazyRecord, translate } from '~/i18n/lazy';
import type { Game, Match, Side } from '~/types';

import { todayIso } from './dates';
import { labelValue } from './format';
import { gameWon, opposite } from './matches';

export type ChallengeOutcome = 'won' | 'lost';

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
});

export const CHALLENGE_REVIEW = msg({
  message: 'Challenge · under review',
  comment: 'Live score chip: a player challenged a line call and the video review (Hawk-Eye) is in progress',
});

export const RALLY_POINTS = msg({
  message: 'Points',
  context: 'rally',
  comment: 'Live score footer: total points won by each side in the match',
});

export const LONGEST_RUN = msg({
  message: 'Longest run',
  comment: 'Live score footer: the most points each side won in a row without the opponent scoring',
});

export const STREAK_LABEL = msg({
  message: '{n, plural, one {# in a row} other {# in a row}}',
  comment: 'Live score: points won in a row by one side without the opponent scoring',
});

export const SAVED_LABEL = msg({
  message: 'Game points saved: {count} of {total}',
  comment:
    'Live score: how many of the opponent’s game points this side has saved since the opponent reached game point, e.g. "Game points saved: 3 of 6"',
});

export const GAME_SHORT = msg({
  message: 'G{n}',
  comment: 'Live score column heading for a game, e.g. G1 = game 1. Keep it to about two characters',
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

export interface Scoring {
  to: number;
  cap: number;
}

const SCORING_21: Scoring = { to: 21, cap: 30 };
const SCORING_15: Scoring = { to: 15, cap: 21 };
const SCORING_15_FROM = '2027-01-01';
const GAMES_TO_WIN = 2;

export const scoringOn = (day: string): Scoring => ((day || todayIso()) >= SCORING_15_FROM ? SCORING_15 : SCORING_21);

export const matchScoring = (m: Pick<Match, 'date'>) => scoringOn(m.date);

export const gameDone = (g: Game, s: Scoring) => {
  const hi = Math.max(g[0], g[1]);
  return hi >= s.cap || (hi >= s.to && hi - Math.min(g[0], g[1]) >= 2);
};

export interface SavedPoints {
  side: Side;
  count: number;
  total: number;
}

const gamePointStarts = new Map<string, { side: Side; from: number; total: number }>();

const gamePointStart = (m: Match, g: Game, s: Scoring) => {
  const key = `${m.id}|${m.games.length}`;
  const known = gamePointStarts.get(key);
  if (known) return known;
  const leader = SIDES.find((x) => g[x] === s.to - 1 && g[opposite(x)] < s.to - 1 && m.lastPoint === x + 1);
  if (leader === undefined) return null;
  const side = opposite(leader);
  const start = { side, from: g[side], total: s.to - 1 - g[side] };
  gamePointStarts.set(key, start);
  return start;
};

export const savedGamePoints = (m: Match): SavedPoints | null => {
  const g = m.current;
  const s = matchScoring(m);
  if (!g || gameDone(g, s)) return null;
  const start = gamePointStart(m, g, s);
  if (!start) return null;
  const count = Math.min(start.total, g[start.side] - start.from);
  return count > 0 ? { side: start.side, count, total: start.total } : null;
};

export type LivePhase = 'play' | 'between' | 'over';

export const livePhase = (m: Match): LivePhase => {
  const g = m.current;
  if (!g || !gameDone(g, matchScoring(m))) return 'play';
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

export const receivingPlayer = (m: Match, server: LiveServer | undefined, receiver: string | null) => {
  if (!receiver || !server || !servingPlayer(m, server)) return null;
  const receiving = m.teams[server.side === 0 ? 1 : 0].players;
  return receiving.some((p) => p.id === receiver) ? receiver : null;
};

const nextStreak = (prev: LiveStats, sides: MatchStats): Streak | null => {
  const a = sides[0].ralliesWon - prev.sides[0].ralliesWon;
  const b = sides[1].ralliesWon - prev.sides[1].ralliesWon;
  if (a < 0 || b < 0 || (a > 0 && b > 0)) return null;
  if (!a && !b) return prev.streak;
  const side: Side = a > 0 ? 0 : 1;
  return { side, count: (prev.streak?.side === side ? prev.streak.count : 0) + a + b };
};

const nextChallenge = (prev: LiveStats, sides: MatchStats, at: number): ChallengeResult | null => {
  for (const side of SIDES) {
    const p = prev.sides[side].challenges;
    const n = sides[side].challenges;
    if (n.won > p.won) return { side, outcome: 'won', at };
    if (n.lost > p.lost) return { side, outcome: 'lost', at };
  }
  return prev.challenge;
};

export const trackLiveStats = (prev: LiveStats | null | undefined, sides: MatchStats, at: number): LiveStats =>
  prev
    ? { sides, streak: nextStreak(prev, sides), challenge: nextChallenge(prev, sides, at) }
    : { sides, streak: null, challenge: null };

const hasGamePoint = (own: number, opp: number, s: Scoring) => own >= s.to - 1 && (own > opp || own === s.cap - 1);

export type CallKind = 'game' | 'match';

export const pointCallKind = (m: Match, side: Side): CallKind | null => {
  const g = m.current;
  const scoring = matchScoring(m);
  if (!g || gameDone(g, scoring) || !hasGamePoint(g[side], g[opposite(side)], scoring)) return null;
  return m.games.some((x) => gameWon(x, side)) ? 'match' : 'game';
};

export const pointCall = (m: Match, side: Side) => {
  const kind = pointCallKind(m, side);
  if (!kind) return null;
  if (kind === 'game')
    return t({
      message: 'Game point',
      comment: 'Live match: this side wins the current game if it wins the next rally',
    });
  if (m.round === 'F')
    return t({
      message: 'Championship point',
      comment: 'Live match in a final: this side wins the title if it wins the next rally',
    });
  return t({
    message: 'Match point',
    comment: 'Live match: this side wins the whole match if it wins the next rally',
  });
};
