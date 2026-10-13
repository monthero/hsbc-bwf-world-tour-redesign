import type { MedalKind } from '~/types';

import type { TournamentTab } from './types';

export const TAB_LABELS: Record<TournamentTab, string> = {
  overview: 'Overview',
  matches: 'Matches',
  draw: 'Draw',
  players: 'Players',
  podium: 'Podium',
  media: 'Media',
  news: 'News',
};

export const OFF_TIPS: Record<TournamentTab, string> = {
  overview: '',
  matches: 'Available once the order of play is out',
  draw: 'Available once the draw is out',
  players: 'Available once the entry list is out',
  podium: 'Available once play starts',
  media: 'Videos appear once play starts',
  news: 'Stories appear once BWF publishes coverage',
};

export const CANCELLED_NOTE = 'This edition was cancelled, so no matches were played.';

const QUALIFYING = { long: 'Qualifying', short: 'Q' };

const GROUPS = { long: 'Group stage', short: 'Groups' };

export const DAY_ROUNDS: Record<string, { long: string; short: string }> = {
  'Q-R32': QUALIFYING,
  'Q-R16': QUALIFYING,
  'Q-QF': QUALIFYING,
  R1: GROUPS,
  R2: GROUPS,
  R3: GROUPS,
  R64: { long: 'Round of 64', short: 'R64' },
  R32: { long: 'Round of 32', short: 'R32' },
  R16: { long: 'Round of 16', short: 'R16' },
  QF: { long: 'Quarter-finals', short: 'QF' },
  SF: { long: 'Semi-finals', short: 'SF' },
  F: { long: 'Finals', short: 'F' },
};

export const KNOCKOUT_ROUNDS = ['R64', 'R32', 'R16', 'QF', 'SF', 'F'];

export const GROUP_STAGE_ROUNDS = ['R1', 'SF', 'F'];

export const QUALIFYING_ROUND = 'Q-R32';

export const EXPECTED_ROUND_TIP = 'Expected round · order of play not out yet';

export const PRIZE_BASE = 500000;

export const DRAW_SEEDS = 8;

export const PODIUM_PRIZES = {
  singles: [37500, 19000, 7250],
  doubles: [39500, 19000, 7000],
} as const;

export const PODIUM_PLACES: readonly { label: string; medal: MedalKind }[] = [
  { label: 'Champion', medal: 'gold' },
  { label: 'Runner-up', medal: 'silver' },
  { label: 'Semi-finalists', medal: 'bronze' },
];

export const FOLLOW_EMPTY = 'Nobody you follow has a match left today.';
export const FOLLOW_HINT = 'Star a player or country in Players or on any match to see their next matches here.';
