import { OFFICIAL_URL } from '~/components/layout/links';

export const NEWS_TITLE = 'World Tour News';
export const NEWS_META = 'Match reports, previews and stats from every stop on the Tour';
export const OFFICIAL_NEWS_URL = `${OFFICIAL_URL}/news/`;

export const LATEST_COUNT = 5;
export const POPULAR_COUNT = 5;
export const INITIAL_MONTHS = 2;

export const SECTION = { latest: 'latest', popular: 'popular' } as const;
export const monthSectionId = (key: string) => `month-${key}`;

export const NAV_GAP = { desktop: 24, mobile: 12 } as const;

export const SKELETON_COUNT = { grid: 6, rows: 4, rail: 6 } as const;
