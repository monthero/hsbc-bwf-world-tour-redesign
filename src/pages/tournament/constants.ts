import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { MedalKind } from '~/types';

import type { TournamentTab } from './types';

export const TAB_LABELS: Record<TournamentTab, MessageDescriptor> = {
  overview: msg({ message: 'Overview', comment: 'Tournament page tab: dates, venue, schedule and past winners' }),
  matches: msg({ message: 'Matches', comment: 'Tournament page tab: order of play, live scores and results' }),
  draw: msg({ message: 'Draw', comment: 'Tournament page tab: the knockout bracket of each event' }),
  players: msg({ message: 'Players', comment: 'Tournament page tab: the entry list, by country or by discipline' }),
  podium: msg({ message: 'Podium', comment: 'Tournament page tab: medalists and how the seeded players did' }),
  videos: msg({ message: 'Videos', comment: 'Tournament page tab: highlights, full matches and live streams' }),
  news: msg({ message: 'News', comment: 'Tournament page tab: news stories about the tournament' }),
};

export const OFF_TIPS: Partial<Record<TournamentTab, MessageDescriptor>> = {
  matches: msg({
    message: 'Available once the order of play is out',
    comment: 'Tooltip on the disabled Matches tab. The order of play is the published daily match schedule',
  }),
  draw: msg({
    message: 'Available once the draw is out',
    comment: 'Tooltip on the disabled Draw tab. The draw is the knockout bracket',
  }),
  players: msg({
    message: 'Available once the entry list is out',
    comment: 'Tooltip on the disabled Players tab',
  }),
  podium: msg({ message: 'Available once play starts', comment: 'Tooltip on the disabled Podium tab' }),
  videos: msg({ message: 'Videos appear once play starts', comment: 'Tooltip on the disabled Videos tab' }),
  news: msg({
    message: 'Stories appear once BWF publishes coverage',
    comment: 'Tooltip on the disabled News tab',
  }),
};

export const CANCELLED_NOTE = msg({
  message: 'This edition was cancelled, so no matches were played.',
  comment: 'Shown on the page of a cancelled tournament instead of the tabs',
});

export interface DayRoundLabel {
  long: MessageDescriptor;
  short: MessageDescriptor;
}

const QUALIFYING: DayRoundLabel = {
  long: msg({
    message: 'Qualifying',
    comment: 'Day timeline label: the qualifying rounds, played before the main draw to fill its last places',
  }),
  short: msg({
    message: 'Q',
    comment: 'Very short day timeline label for the qualifying rounds (abbreviation of Qualifying)',
  }),
};

const GROUPS: DayRoundLabel = {
  long: msg({
    message: 'Group stage',
    comment: 'Day timeline label: the round-robin group stage of the World Tour Finals',
  }),
  short: msg({ message: 'Groups', comment: 'Short day timeline label for the round-robin group stage' }),
};

export const DAY_ROUNDS: Record<string, DayRoundLabel> = {
  'Q-R32': QUALIFYING,
  'Q-R16': QUALIFYING,
  'Q-QF': QUALIFYING,
  R1: GROUPS,
  R2: GROUPS,
  R3: GROUPS,
  R64: {
    long: msg({ message: 'Round of 64', comment: 'Day timeline label: the knockout round with 64 players or pairs' }),
    short: msg({ message: 'R64', comment: 'Short day timeline label for the round of 64' }),
  },
  R32: {
    long: msg({ message: 'Round of 32', comment: 'Day timeline label: the knockout round with 32 players or pairs' }),
    short: msg({ message: 'R32', comment: 'Short day timeline label for the round of 32' }),
  },
  R16: {
    long: msg({ message: 'Round of 16', comment: 'Day timeline label: the knockout round with 16 players or pairs' }),
    short: msg({ message: 'R16', comment: 'Short day timeline label for the round of 16' }),
  },
  QF: {
    long: msg({ message: 'Quarter-finals', comment: 'Day timeline label: the day the quarter-finals are played' }),
    short: msg({ message: 'QF', comment: 'Short day timeline label for the quarter-finals' }),
  },
  SF: {
    long: msg({ message: 'Semi-finals', comment: 'Day timeline label: the day the semi-finals are played' }),
    short: msg({ message: 'SF', comment: 'Short day timeline label for the semi-finals' }),
  },
  F: {
    long: msg({ message: 'Finals', comment: 'Day timeline label: the last day, when the five finals are played' }),
    short: msg({ message: 'F', comment: 'Very short day timeline label for finals day (abbreviation of Finals)' }),
  },
};

export const KNOCKOUT_ROUNDS = ['R64', 'R32', 'R16', 'QF', 'SF', 'F'];

export const GROUP_STAGE_ROUNDS = ['R1', 'SF', 'F'];

export const QUALIFYING_ROUND = 'Q-R32';

export const EXPECTED_ROUND_TIP = msg({
  message: 'Expected round · order of play not out yet',
  comment: 'Tooltip on a day timeline round that is guessed, because the daily match schedule isn’t published yet',
});

export const REST_DAY_LABEL = msg({
  message: 'Rest day',
  comment: 'A day during the tournament with no matches',
});

export const PRIZE_MONEY = msg({ message: 'Prize money', comment: 'Label for a tournament’s total prize money' });

export const PRIZE_BASE = 500000;

export const DRAW_SEEDS = 8;

export const PODIUM_PRIZES = {
  singles: [37500, 19000, 7250],
  doubles: [39500, 19000, 7000],
} as const;

export const PODIUM_PLACES: readonly { label: MessageDescriptor; medal: MedalKind }[] = [
  { label: msg({ message: 'Champion', comment: 'Podium place: winner of the final (gold)' }), medal: 'gold' },
  { label: msg({ message: 'Runner-up', comment: 'Podium place: loser of the final (silver)' }), medal: 'silver' },
  {
    label: msg({ message: 'Semi-finalists', comment: 'Podium place: the two losing semi-finalists (bronze)' }),
    medal: 'bronze',
  },
];

export const FOLLOW_EMPTY = msg({
  message: 'Nobody you follow has a match left today.',
  comment: 'Empty state of the Following today card on the tournament overview',
});
export const FOLLOW_HINT = msg({
  message: 'Star a player or country in Players or on any match to see their next matches here.',
  comment: 'Hint in the Following today card when the visitor follows nobody. Players is the tab name',
});
