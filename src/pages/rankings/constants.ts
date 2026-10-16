import { msg } from '@lingui/core/macro';

import type { LazyOption } from '~/i18n/useLazyOptions';
import type { RankingKind } from '~/types';

export const DEFAULT_KIND: RankingKind = 'world';

export const KIND_OPTIONS: readonly LazyOption<RankingKind>[] = [
  {
    value: 'world',
    label: msg({ message: 'World', comment: 'Rankings switch option: the BWF world ranking' }),
    tip: msg({ message: 'BWF World Rankings', comment: 'Tooltip of the World option in the rankings switch' }),
  },
  {
    value: 'race',
    label: msg({
      message: 'Race to Finals',
      comment:
        'Rankings switch option: the season standings that decide who qualifies for the HSBC BWF World Tour Finals',
    }),
    tip: msg({
      message: 'HSBC BWF World Tour Finals race',
      comment: 'Tooltip of the Race to Finals option in the rankings switch',
    }),
  },
];

export const PODIUM_MEDALS = ['gold', 'silver', 'bronze'] as const;

export const SEARCH_DEBOUNCE_MS = 250;
