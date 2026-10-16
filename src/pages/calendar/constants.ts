import { msg } from '@lingui/core/macro';

import type { LazyOption } from '~/i18n/useLazyOptions';

import type { StatusFilter } from './types';

export const STATUS_OPTIONS: readonly LazyOption<StatusFilter>[] = [
  {
    value: 'all',
    label: msg({ message: 'All', comment: 'Calendar status filter option that shows every tournament of the season' }),
  },
  {
    value: 'done',
    label: msg({
      message: 'Completed',
      context: 'filter',
      comment: 'Calendar status filter option that shows only tournaments that have already finished',
    }),
  },
  {
    value: 'up',
    label: msg({
      message: 'Remaining',
      comment:
        'Calendar status filter option that shows only tournaments still to be played this season (upcoming or in progress)',
    }),
  },
];

export const PROVISIONAL_TIP = msg({
  message: 'Dates and venues are provisional until BWF confirms them',
  comment: 'Tooltip on the “Provisional” tag next to a future season’s year in the calendar header',
});

export const COMPACT_HEIGHT = { desktop: 54, mobile: 48 } as const;

export const AUTO_SCROLL_DELAYS = [0, 300, 1000] as const;

export const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
