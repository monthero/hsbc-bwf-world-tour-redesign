import { Select, type ComboboxItem, type SelectProps } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo } from 'react';

import { Flag } from '~/components/country';
import { SearchField, StickyBar } from '~/components/ui';
import { formatNumber, plural } from '~/utils/format';

import type { CountryOption } from '../types';

import classes from './FilterBar.module.css';
import utils from '~/styles/utils.module.css';

const SELECT_CLASSES = {
  root: classes.country,
  input: classes.countryInput,
  section: classes.countrySection,
  dropdown: clsx(utils.popover, classes.dropdown),
  option: classes.option,
};

const COMBOBOX_PROPS = { offset: 6, width: 260, position: 'bottom-end' } as const;

const unitOf = (doubles: boolean) => (doubles ? 'pair' : 'player');

export const FilterBar = memo<{
  query: string;
  onQuery: (q: string) => void;
  cc: string | undefined;
  onCountry: (cc: string | null) => void;
  countries: CountryOption[];
  shown: number;
  total: number;
  doubles: boolean;
}>(({ query, onQuery, cc, onCountry, countries, shown, total, doubles }) => {
  const counts = useMemo(() => new Map(countries.map((c) => [c.value, c.count])), [countries]);
  const renderOption = useCallback<NonNullable<SelectProps['renderOption']>>(
    ({ option }: { option: ComboboxItem }) => (
      <>
        <Flag cc={option.value} size="sm" tip={false} />
        <span className={utils.ellipsis}>{option.label}</span>
        <span className={clsx(utils.num, classes.optionCount)}>{counts.get(option.value)}</span>
      </>
    ),
    [counts],
  );
  const filtered = shown !== total;
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
        <Select
          data={countries}
          value={cc ?? null}
          onChange={onCountry}
          renderOption={renderOption}
          leftSection={cc ? <Flag cc={cc} size="sm" tip={false} /> : null}
          placeholder="All countries"
          aria-label="Filter by country"
          searchable
          clearable
          nothingFoundMessage="No country"
          maxDropdownHeight={320}
          comboboxProps={COMBOBOX_PROPS}
          classNames={SELECT_CLASSES}
        />
        <span className={clsx(utils.num, classes.count)} aria-live="polite">
          {filtered && `${formatNumber(shown)} of `}
          {plural(total, unitOf(doubles))}
        </span>
      </div>
    </StickyBar>
  );
});
