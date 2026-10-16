import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { CountSelect } from '~/components/filters';
import { SearchField, StickyBar } from '~/components/ui';
import type { CountOption } from '~/utils/filter';
import { formatNumber } from '~/utils/format';

import classes from './FilterBar.module.css';
import utils from '~/styles/utils.module.css';

const PAIRS = msg({
  message: '{total, plural, one {# pair} other {# pairs}}',
  comment: 'Number of doubles pairs in the ranking list',
});

const PAIRS_SHOWN = msg({
  message: '{count} of {total, plural, one {# pair} other {# pairs}}',
  comment: 'Number of doubles pairs shown after filtering, out of the total in the ranking',
});

const PLAYERS = msg({
  message: '{total, plural, one {# player} other {# players}}',
  comment: 'Number of players in the ranking list',
});

const PLAYERS_SHOWN = msg({
  message: '{count} of {total, plural, one {# player} other {# players}}',
  comment: 'Number of players shown after filtering, out of the total in the ranking',
});

export const FilterBar = memo<{
  query: string;
  onQuery: (q: string) => void;
  cc: string | undefined;
  onCountry: (cc: string | undefined) => void;
  countries: CountOption[];
  shown: number;
  total: number;
  doubles: boolean;
}>(({ query, onQuery, cc, onCountry, countries, shown, total, doubles }) => {
  const { t, i18n } = useLingui();
  const count = formatNumber(shown);
  const all = shown === total;
  let summary: string;
  if (doubles) summary = i18n._({ ...(all ? PAIRS : PAIRS_SHOWN), values: { count, total } });
  else summary = i18n._({ ...(all ? PLAYERS : PLAYERS_SHOWN), values: { count, total } });
  return (
    <StickyBar glass zIndex={5}>
      <div className={clsx(utils.container, classes.inner)}>
        <SearchField
          value={query}
          onChange={onQuery}
          placeholder={
            doubles
              ? t({ message: 'Search players or pairs', comment: 'Placeholder of the doubles rankings search box' })
              : t({ message: 'Search players', comment: 'Rankings search box: placeholder and accessible label' })
          }
          aria-label={t({
            message: 'Search players',
            comment: 'Rankings search box: placeholder and accessible label',
          })}
          className={classes.search}
        />
        <CountSelect
          data={countries}
          value={cc}
          onChange={onCountry}
          placeholder={t({ message: 'All countries', comment: 'Country filter: no country selected' })}
          label={t`Filter by country`}
          nothingFound={t({ message: 'No country', comment: 'Country filter: the search matched no country' })}
          width={220}
          align="end"
          flags
        />
        <span className={clsx(utils.num, classes.count)} aria-live="polite">
          {summary}
        </span>
      </div>
    </StickyBar>
  );
});
