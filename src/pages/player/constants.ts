import type { MediaKind } from '~/api/schemas';
import type { TabItem } from '~/components/ui';

import type { PlayerTab } from './types';

export const PLAYER_TAB_ITEMS: readonly TabItem<PlayerTab>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'matches', label: 'Matches' },
  { value: 'results', label: 'Results' },
  { value: 'rankings', label: 'Rankings' },
  { value: 'media', label: 'Media' },
];

export const RESULT_LABELS: Record<number, string> = {
  1: 'Winner',
  2: 'Runner-up',
  3: 'Semi-final',
  5: 'Quarter-final',
  9: 'R16',
  17: 'R32',
  33: 'R64',
  65: 'R128',
};

export const LOSS_RESULT: Record<string, number> = { F: 2, SF: 3, QF: 5, R16: 9, R32: 17, R64: 33 };

export const RESULT_TAGS: Record<number, string> = { 1: 'W', 2: 'F', 3: 'SF' };

export const RECENT_LIMIT = 10;

export const TITLE_LIMIT = 8;

export const RESULTS_TIP = 'Results counting toward the current world ranking';

export const PARTNER_LIMIT = 6;

export const EQUIPMENT_NOTE =
  '[NOTE] Players change equipment often, by preference or for sponsorship reasons, so this information may be outdated.';

export const VIDEO_STEP = 6;

export const NEWS_STEP = 12;

export const VIDEO_LABELS: Partial<Record<MediaKind, string>> = { highlights: 'Highlights', full_match: 'Full match' };
