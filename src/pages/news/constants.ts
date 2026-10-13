import { OFFICIAL_URL } from '~/components/layout/links';

export const NEWS_TITLE = 'World Tour News';
export const NEWS_META = 'Match reports, previews and stats from every stop on the Tour';
export const OFFICIAL_NEWS_URL = `${OFFICIAL_URL}/news/`;

export const LATEST_COUNT = 5;
export const POPULAR_COUNT = 5;
export const INITIAL_MONTHS = 2;

export const SECTION = { latest: 'latest', popular: 'popular' } as const;
const MONTH_PREFIX = 'month-';
export const monthSectionId = (key: string) => `${MONTH_PREFIX}${key}`;
export const sectionMonth = (id: string | null) =>
  id?.startsWith(MONTH_PREFIX) ? id.slice(MONTH_PREFIX.length) : undefined;

export const URL_SYNC_MS = 400;

export const NAV_GAP = { desktop: 24, mobile: 12 } as const;

export const SKELETON_COUNT = { rail: 6 } as const;

export const CARD_MIN_WIDTH = 300;
export const GRID_GAP = 16;
export const GRID_ROW_GAP = 20;
export const CARD_RATIO = 9 / 16;
export const LOAD_AHEAD = '0px 0px 150% 0px';

export const ROW_ESTIMATE = {
  head: { desktop: 84, mobile: 56 },
  compact: 96,
  cardBody: 138,
  failed: 96,
  subscribe: 120,
} as const;
