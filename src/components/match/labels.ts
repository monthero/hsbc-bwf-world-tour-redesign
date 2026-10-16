import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { MatchOutcome } from '~/types';

export const TBD = msg({
  message: 'TBD',
  comment: 'Short for “to be decided”: the player, team or match time isn’t known yet',
});

export const OUTCOME_LABELS: Record<Exclude<MatchOutcome, 'up'>, MessageDescriptor> = {
  W: msg({ message: 'W', comment: 'One-letter badge for a match the player won' }),
  L: msg({ message: 'L', comment: 'One-letter badge for a match the player lost' }),
  Live: msg({ message: 'Live', context: 'match status', comment: 'Badge for a match being played right now' }),
};

export const PILL_LABELS: Partial<Record<MatchOutcome, MessageDescriptor>> = {
  W: msg({ message: 'WON', comment: 'Uppercase badge on a head-to-head result the player won' }),
  L: msg({ message: 'LOST', comment: 'Uppercase badge on a head-to-head result the player lost' }),
};
