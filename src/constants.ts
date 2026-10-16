import { msg } from '@lingui/core/macro';
import type { CSSProperties } from 'react';

import { EventCode, Level } from '~/api/schemas';
import type { SegmentedOption } from '~/components/ui';
import { lazyRecord } from '~/i18n/lazy';
import { today } from '~/utils/dates';

export const LIVE_DATA = import.meta.env.VITE_DATA_SOURCE !== 'snapshot';
export const BWF_RELAY_URL = 'https://bwf-relay.monthero-dev.workers.dev';
export const LIVE_NEWS = LIVE_DATA && import.meta.env.DEV;
export const SEASON_YEAR = today().year();
export const FIRST_SEASON = 2018;
export const SITE_ORIGIN = 'https://hsbc-bwf-world-tour-redesign.vercel.app';

export const EVENT_NAMES: Record<EventCode, string> = lazyRecord({
  MS: msg({ message: "Men's singles", comment: 'Badminton discipline (event): one man against one man' }),
  WS: msg({ message: "Women's singles", comment: 'Badminton discipline (event): one woman against one woman' }),
  MD: msg({ message: "Men's doubles", comment: 'Badminton discipline (event): two men against two men' }),
  WD: msg({ message: "Women's doubles", comment: 'Badminton discipline (event): two women against two women' }),
  XD: msg({
    message: 'Mixed doubles',
    comment: 'Badminton discipline (event): pairs of one man and one woman against each other',
  }),
});

export const EVENT_OPTIONS: readonly SegmentedOption<EventCode>[] = EventCode.options.map((code) => ({
  value: code,
  label: code,
  get tip() {
    return EVENT_NAMES[code];
  },
  event: code,
}));

export const DOUBLES_EVENTS: ReadonlySet<EventCode> = new Set<EventCode>(['MD', 'WD', 'XD']);

export const ROUND_NAMES: Record<string, string> = lazyRecord({
  'Q-R32': msg({
    message: 'Qualifying R32',
    comment:
      'Round name: qualifying round of 32 players or pairs. Qualifying is the preliminary draw played before the main draw; its winners join the main draw.',
  }),
  'Q-R16': msg({
    message: 'Qualifying R16',
    comment:
      'Round name: qualifying round of 16 players or pairs. Qualifying is the preliminary draw played before the main draw; its winners join the main draw.',
  }),
  'Q-QF': msg({
    message: 'Qualifying QF',
    comment:
      'Round name: qualifying quarter-final. Qualifying is the preliminary draw played before the main draw; its winners join the main draw.',
  }),
  'Q-SF': msg({
    message: 'Qualifying SF',
    comment:
      'Round name: qualifying semi-final. Qualifying is the preliminary draw played before the main draw; its winners join the main draw.',
  }),
  'Q-F': msg({
    message: 'Qualifying final',
    comment:
      'Round name: final of the qualifying draw. Qualifying is the preliminary draw played before the main draw; its winners join the main draw.',
  }),
  R1: msg({
    message: 'Group round 1',
    comment: 'Round name at the World Tour Finals, which starts with groups of four: first round of group matches',
  }),
  R2: msg({ message: 'Group round 2', comment: 'Round name at the World Tour Finals: second round of group matches' }),
  R3: msg({ message: 'Group round 3', comment: 'Round name at the World Tour Finals: third round of group matches' }),
  R64: msg({ message: 'Round of 64', comment: 'Round name: the main-draw round with 64 players or pairs left' }),
  R32: msg({ message: 'Round of 32', comment: 'Round name: the main-draw round with 32 players or pairs left' }),
  R16: msg({ message: 'Round of 16', comment: 'Round name: the main-draw round with 16 players or pairs left' }),
  QF: msg({ message: 'Quarter-final', comment: 'Round name: the round with 8 players or pairs left' }),
  SF: msg({ message: 'Semi-final', comment: 'Round name: the round with 4 players or pairs left' }),
  F: msg({ message: 'Final', comment: 'Round name: the last match of a tournament draw, which decides the champion' }),
});

export const GROUP_STAGE = msg({
  message: 'Group stage',
  comment: 'World Tour Finals: the first phase, where players play round-robin groups of four before the knockouts',
});

export const GROUP_ROUND_NAMES: Record<string, string> = lazyRecord({
  R1: msg({ message: 'Round 1', comment: 'World Tour Finals: first round of matches inside a group' }),
  R2: msg({ message: 'Round 2', comment: 'World Tour Finals: second round of matches inside a group' }),
  R3: msg({ message: 'Round 3', comment: 'World Tour Finals: third round of matches inside a group' }),
});

export const ROUND_ORDER: Record<string, number> = {
  'Q-R32': 0,
  'Q-R16': 0,
  'Q-QF': 0,
  R1: 1,
  R2: 1,
  R3: 1,
  R64: 1,
  R32: 2,
  R16: 3,
  QF: 4,
  SF: 5,
  F: 6,
};

export const REST_DAY = msg({
  message: 'Rest day',
  comment: 'A tournament day with no matches scheduled',
});

export const NOTE_LABELS = lazyRecord({
  Walkover: {
    short: msg({
      message: 'WO',
      comment:
        'Short tag for a walkover: the match was not played because one side withdrew, so the other side advances. Keep it very short',
    }),
    long: msg({
      message: 'Walkover',
      comment: 'A match not played because one side withdrew before it started; the other side advances',
    }),
  },
  Retired: {
    short: msg({
      message: 'RET',
      comment:
        'Short tag for a retirement: a player stopped during the match (usually injured) and lost. Keep it very short',
    }),
    long: msg({
      message: 'Retired',
      context: 'match result',
      comment: 'A match ended early because one side stopped playing during it, usually through injury, and lost',
    }),
  },
});

const SUPER = msg({
  message: 'Super {tier}',
  comment:
    'Tournament tier (level) name, e.g. "Super 750". {tier} is 1000, 750, 500 or 300 (higher means more points and prize money). It is an official proper name, usually kept as is',
});

const superTier = (tier: string) => ({ ...SUPER, values: { tier } });

export const LEVEL_META: Record<Level, { label: string; long: string; color: string; text: string }> = lazyRecord({
  '1000': {
    label: superTier('1000'),
    long: superTier('1000'),
    color: 'var(--bwf-lv-1000)',
    text: 'var(--bwf-lv-1000-text)',
  },
  '750': {
    label: superTier('750'),
    long: superTier('750'),
    color: 'var(--bwf-lv-750)',
    text: 'var(--bwf-lv-750-text)',
  },
  '500': {
    label: superTier('500'),
    long: superTier('500'),
    color: 'var(--bwf-lv-500)',
    text: 'var(--bwf-lv-500-text)',
  },
  '300': {
    label: superTier('300'),
    long: superTier('300'),
    color: 'var(--bwf-lv-300)',
    text: 'var(--bwf-lv-300-text)',
  },
  Finals: {
    label: msg({
      message: 'Finals',
      context: 'tournament level',
      comment:
        'Short name of the World Tour Finals, the season-ending tournament for the top 8 of the season ranking in each discipline',
    }),
    long: msg({
      message: 'World Tour Finals',
      comment: 'The season-ending tournament for the top 8 of the season ranking in each discipline; an official name',
    }),
    color: 'var(--bwf-lv-finals)',
    text: 'var(--bwf-lv-finals-text)',
  },
});

const LEVEL_TOKEN: Record<Level, string> = {
  '1000': '1000',
  '750': '750',
  '500': '500',
  '300': '300',
  Finals: 'finals',
};

export const LEVEL_VARS = Object.fromEntries(
  Level.options.map((l) => [
    l,
    {
      '--lv': LEVEL_META[l].color,
      '--lv-text': `var(--bwf-lv-${LEVEL_TOKEN[l]}-text)`,
      '--lv-tint': `var(--bwf-lv-${LEVEL_TOKEN[l]}-tint)`,
      '--lv-muted': `var(--bwf-lv-${LEVEL_TOKEN[l]}-muted)`,
    } as CSSProperties,
  ]),
) as Record<Level, CSSProperties>;

export const QUALIFY_SPOTS = 8;
export const QUALIFY_PER_COUNTRY = 2;
export const DRAW_SIZE = 32;

export const LEVEL_POINTS: Record<Level, number> = {
  Finals: 14000,
  '1000': 12000,
  '750': 11000,
  '500': 9200,
  '300': 7000,
};

export const SUPER_100_POINTS = 5500;

export const TOUR_CYCLES: readonly { from: number; to: number; super100: 'pathway' | 'tour' }[] = [
  { from: 2018, to: 2022, super100: 'pathway' },
  { from: 2023, to: 2026, super100: 'pathway' },
  { from: 2027, to: 2030, super100: 'tour' },
];
export const NOT_QUALIFY_TIP = msg({
  message: 'In the top 8, but two players from the same country rank higher — not qualifying (max. 2 per country)',
  comment:
    'Tooltip in the Race to Finals ranking (the season ranking that decides who plays the World Tour Finals): the player is in the top 8 but at most 2 per country may qualify',
});
