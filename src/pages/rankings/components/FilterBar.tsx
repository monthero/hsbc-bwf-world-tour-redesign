import { clsx } from 'clsx';
import { memo } from 'react';

import { CountSelect } from '~/components/filters';
import { SearchField, StickyBar } from '~/components/ui';
import { shownLabel, type CountOption } from '~/utils/filter';

import classes from './FilterBar.module.css';
import utils from '~/styles/utils.module.css';

const unitOf = (doubles: boolean) => (doubles ? 'pair' : 'player');

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
  return (
    <StickyBar glass zIndex={5}>
      <div className={clsx(utils.container, classes.inner)}>
        <SearchField
          value={query}
          onChange={onQuery}
          placeholder={doubles ? 'Search players or pairs' : 'Search players'}
          aria-label="Search players"
          className={classes.search}
        />
        <CountSelect
          data={countries}
          value={cc}
          onChange={onCountry}
          placeholder="All countries"
          label="Filter by country"
          nothingFound="No country"
          width={220}
          align="end"
          flags
        />
        <span className={clsx(utils.num, classes.count)} aria-live="polite">
          {shownLabel(shown, total, unitOf(doubles))}
        </span>
      </div>
    </StickyBar>
  );
});
