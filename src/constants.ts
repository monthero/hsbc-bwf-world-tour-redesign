import type { CSSProperties } from 'react';

import { EventCode, Level } from '~/api/schemas';
import type { SegmentedOption } from '~/components/ui';
import { today } from '~/utils/dates';

export const LIVE_DATA = import.meta.env.VITE_DATA_SOURCE !== 'snapshot';
export const BWF_RELAY_URL = 'https://bwf-relay.monthero-dev.workers.dev';
export const LIVE_NEWS = LIVE_DATA && import.meta.env.DEV;
export const SEASON_YEAR = today().year();
export const FIRST_SEASON = 2018;
export const NOT_FOUND = 'Not found';

export const EVENT_NAMES: Record<EventCode, string> = {
  MS: "Men's singles",
  WS: "Women's singles",
  MD: "Men's doubles",
  WD: "Women's doubles",
  XD: 'Mixed doubles',
};

export const EVENT_OPTIONS: readonly SegmentedOption<EventCode>[] = EventCode.options.map((code) => ({
  value: code,
  label: code,
  tip: EVENT_NAMES[code],
}));

export const DOUBLES_EVENTS: ReadonlySet<EventCode> = new Set<EventCode>(['MD', 'WD', 'XD']);

export const ROUND_NAMES: Record<string, string> = {
  'Q-R32': 'Qualifying R32',
  'Q-R16': 'Qualifying R16',
  'Q-QF': 'Qualifying QF',
  R1: 'Group round 1',
  R2: 'Group round 2',
  R3: 'Group round 3',
  R64: 'Round of 64',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-final',
  SF: 'Semi-final',
  F: 'Final',
};

export const GROUP_STAGE = 'Group stage';

export const GROUP_ROUND_NAMES: Record<string, string> = { R1: 'Round 1', R2: 'Round 2', R3: 'Round 3' };

export const NEXT_ROUND: Record<string, string> = { R32: 'R16', R16: 'QF', QF: 'SF', SF: 'final', F: 'title' };

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

export const REST_DAY = 'Rest day';

export const NOTE_LABELS = {
  Walkover: { short: 'WO', long: 'Walkover', verb: 'withdrew before the match' },
  Retired: { short: 'RET', long: 'Retired', verb: 'retired during the match' },
} as const;

export const LEVEL_META: Record<Level, { label: string; long: string; color: string }> = {
  '1000': { label: 'Super 1000', long: 'Super 1000', color: 'var(--bwf-lv-1000)' },
  '750': { label: 'Super 750', long: 'Super 750', color: 'var(--bwf-lv-750)' },
  '500': { label: 'Super 500', long: 'Super 500', color: 'var(--bwf-lv-500)' },
  '300': { label: 'Super 300', long: 'Super 300', color: 'var(--bwf-lv-300)' },
  Finals: { label: 'Finals', long: 'World Tour Finals', color: 'var(--bwf-lv-finals)' },
};

export const LEVEL_VARS = Object.fromEntries(
  Level.options.map((l) => [l, { '--lv': LEVEL_META[l].color } as CSSProperties]),
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
export const NOT_QUALIFY_TIP =
  'In the top 8, but two players from the same country rank higher — not qualifying (max. 2 per country)';
