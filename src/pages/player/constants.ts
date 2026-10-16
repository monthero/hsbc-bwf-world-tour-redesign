import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { MediaKind } from '~/api/schemas';

import type { PlayerTab } from './types';

export const PLAYER_TAB_ITEMS: readonly { value: PlayerTab; label: MessageDescriptor }[] = [
  { value: 'overview', label: msg({ message: 'Overview', comment: 'Player profile tab: summary of the player' }) },
  { value: 'matches', label: msg({ message: 'Matches', comment: 'Player profile tab: list of matches by season' }) },
  {
    value: 'results',
    label: msg({ message: 'Results', comment: 'Player profile tab: tournament results counting toward the ranking' }),
  },
  { value: 'rankings', label: msg({ message: 'Rankings', comment: 'Player profile tab: world ranking history' }) },
  { value: 'media', label: msg({ message: 'Media', comment: 'Player profile tab: videos and news stories' }) },
];

export const RESULT_LABELS: Record<number, MessageDescriptor> = {
  1: msg({ message: 'Winner', comment: 'Best result at a tournament: won the title' }),
  2: msg({ message: 'Runner-up', comment: 'Best result at a tournament: lost the final' }),
  3: msg({
    message: 'Semi-final',
    context: 'best result',
    comment: 'Best result at a tournament: lost in the semi-finals',
  }),
  5: msg({
    message: 'Quarter-final',
    context: 'best result',
    comment: 'Best result at a tournament: lost in the quarter-finals',
  }),
  9: msg({
    message: 'R16',
    context: 'best result',
    comment: 'Best result at a tournament, abbreviated: lost in the round of 16',
  }),
  17: msg({
    message: 'R32',
    context: 'best result',
    comment: 'Best result at a tournament, abbreviated: lost in the round of 32',
  }),
  33: msg({
    message: 'R64',
    context: 'best result',
    comment: 'Best result at a tournament, abbreviated: lost in the round of 64',
  }),
  65: msg({ message: 'R128', comment: 'Best result at a tournament, abbreviated: lost in the round of 128' }),
};

export const LOSS_RESULT: Record<string, number> = { F: 2, SF: 3, QF: 5, R16: 9, R32: 17, R64: 33 };

export const RESULT_TAGS: Record<number, MessageDescriptor> = {
  1: msg({
    message: 'W',
    context: 'tournament result',
    comment: 'One-letter tag on a ranking points bar: the player won the tournament',
  }),
  2: msg({
    message: 'F',
    context: 'tournament result',
    comment: 'Short tag on a ranking points bar: the player reached the final',
  }),
  3: msg({
    message: 'SF',
    context: 'tournament result',
    comment: 'Short tag on a ranking points bar: the player reached the semi-finals',
  }),
};

export const RECENT_LIMIT = 10;

export const TITLE_LIMIT = 8;

export const RESULTS_TIP = msg({
  message: 'Results counting toward the current world ranking',
  comment: 'Tooltip on the discipline heading in the player Results tab',
});

export const PARTNER_LIMIT = 6;

export const VIDEO_STEP = 6;

export const NEWS_STEP = 12;

export const VIDEO_LABELS: Partial<Record<MediaKind, MessageDescriptor>> = {
  highlights: msg({ message: 'Highlights', comment: 'Video type label: match highlights' }),
  full_match: msg({ message: 'Full match', comment: 'Video type label: the whole match' }),
};
