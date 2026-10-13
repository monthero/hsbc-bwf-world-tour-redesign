import type { Level } from '~/types';
import { localAsset } from '~/utils/images';

import type { SeasonStatus } from './types';

export const ABOUT_KICKER = 'About the Tour';
export const ABOUT_TITLE = 'HSBC BWF World Tour';
export const ROAD_TO = 'The road to';
export const ABOUT_META =
  'A season-long circuit of the world’s best in singles and doubles, building to the World Tour Finals in December';

export const ABOUT_SECTIONS = [
  { id: 'tiers', title: 'How the Tour works' },
  { id: 'race', title: 'Race to the Finals' },
] as const;

export const SPOTLIGHT = ['next', 'finale', 'titles'] as const;

export const MAP_SIZE = { w: 1000, h: 401 } as const;
export const MAP_ASSET = localAsset('/assets/world-dots.svg');
export const PIN_GAP_PX = { desktop: 17, mobile: 10 } as const;
export const WIDTH_STEP = 40;
export const ANCHOR_PX = 2;
export const RELAX = { iterations: 48, spring: 0.04, angle: 2.39996, leader: 0.25 } as const;
export const FLIP_AT = 0.62;

export const KICKERS = {
  next: 'Next stop',
  live: 'Live now',
  finals: 'Finals',
  done: 'Completed',
  cancelled: 'Cancelled',
} as const;

export const CLOSE_DELAY = 160;

export const LEGEND_LEVELS = ['1000', '750', '500', '300', 'Finals'] as const satisfies readonly Level[];

export const STATUS_META: Record<SeasonStatus, { label: string; color: string }> = {
  done: { label: 'Completed', color: 'var(--bwf-text-3)' },
  up: { label: 'Upcoming', color: 'var(--bwf-text)' },
  next: { label: 'Live / next', color: 'var(--bwf-red-text)' },
};

export const TIER_LEVELS = ['Finals', '1000', '750', '500', '300'] as const;

export const TITLES_TOP_N = 5;

export const UP_NEXT = 'Up next';

export const PATHWAY_NOTE = 'The pathway into the Tour. Ranking points, but not part of the World Tour.';

export const RACE_LINE = 'Qualification line';
