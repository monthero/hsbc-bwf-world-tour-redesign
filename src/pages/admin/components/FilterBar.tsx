import { useDebouncedCallback } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useRef, useState, type FC, type ReactNode } from 'react';

import { CountSelect } from '~/components/filters';
import { FilterChip, SearchField, Segmented, StickyBar } from '~/components/ui';
import { EVENT_OPTIONS } from '~/constants';
import type { EventCode } from '~/types';
import { shownLabel, toggleItem, type CountOption } from '~/utils/filter';

import {
  ACTIVITY_OPTIONS,
  DEFAULT_ACTIVITY,
  DEFAULT_SORT,
  SORT_OPTIONS,
  TOGGLES,
  type Criteria,
  type Toggle,
} from '../filters';
import type { Activity, AdminSearch, SortKey } from '../types';

import classes from './FilterBar.module.css';
import utils from '~/styles/utils.module.css';

const DEBOUNCE = { delay: 200, flushOnUnmount: true };

const ToggleChip = memo<{ toggle: Toggle; active: boolean; onToggle: (key: string) => void }>(
  ({ toggle, active, onToggle }) => (
    <FilterChip size="sm" active={active} onClick={() => onToggle(toggle.key)}>
      {toggle.label}
    </FilterChip>
  ),
);

const DebouncedSearch = memo<{ value: string; onChange: (q: string) => void }>(({ value, onChange }) => {
  const [text, setText] = useState(value);
  const pushed = useRef(value);
  const push = useDebouncedCallback((v: string) => {
    pushed.current = v.trim();
    onChange(pushed.current);
  }, DEBOUNCE);

  useEffect(() => {
    if (value === pushed.current) return;
    pushed.current = value;
    setText(value);
  }, [value]);

  const onText = useCallback(
    (v: string) => {
      setText(v);
      push(v);
    },
    [push],
  );
  return (
    <SearchField
      value={text}
      onChange={onText}
      placeholder="Search name, id or country"
      aria-label="Search players"
      className={classes.search}
    />
  );
});

export const FilterShell: FC<{ children: ReactNode }> = ({ children }) => (
  <StickyBar glass zIndex={5} className={classes.bar}>
    <div className={clsx(utils.container, classes.inner)}>{children}</div>
  </StickyBar>
);

export const FilterControls = memo<{
  criteria: Criteria;
  onPatch: (next: Partial<AdminSearch>) => void;
  countries: readonly CountOption[];
  brands: readonly CountOption[];
  shown: number;
  total: number;
}>(({ criteria, onPatch, countries, brands, shown, total }) => {
  const onQuery = useCallback((q: string) => onPatch({ q: q || undefined }), [onPatch]);
  const onCountry = useCallback((cc: string | undefined) => onPatch({ cc }), [onPatch]);
  const onBrand = useCallback((brand: string | undefined) => onPatch({ brand }), [onPatch]);
  const onEvent = useCallback((ev: EventCode | null) => onPatch({ ev: ev ?? undefined }), [onPatch]);
  const onActive = useCallback(
    (v: Activity | null) => onPatch({ active: !v || v === DEFAULT_ACTIVITY ? undefined : v }),
    [onPatch],
  );
  const onSort = useCallback(
    (v: SortKey | null) => onPatch({ sort: !v || v === DEFAULT_SORT ? undefined : v }),
    [onPatch],
  );
  const onToggle = useCallback(
    (key: string) => onPatch({ flags: toggleItem(criteria.flags, key) }),
    [criteria.flags, onPatch],
  );

  return (
    <>
      <div className={classes.row}>
        <DebouncedSearch value={criteria.query} onChange={onQuery} />
        <CountSelect
          data={countries}
          value={criteria.cc}
          onChange={onCountry}
          placeholder="All countries"
          label="Filter by country"
          nothingFound="No match"
          width={200}
          align="start"
          flags
        />
        <CountSelect
          data={brands}
          value={criteria.brand}
          onChange={onBrand}
          placeholder="Any equipment brand"
          label="Filter by equipment brand"
          nothingFound="No match"
          width={200}
          align="start"
        />
        <span className={clsx(utils.num, classes.count)} aria-live="polite">
          {shownLabel(shown, total, 'player')}
        </span>
      </div>
      <div className={classes.row}>
        <Segmented
          options={EVENT_OPTIONS}
          value={criteria.ev}
          onChange={onEvent}
          deselectable
          height={28}
          className={classes.events}
        />
        <Segmented
          options={ACTIVITY_OPTIONS}
          value={criteria.active}
          onChange={onActive}
          height={28}
          className={classes.activity}
        />
        <Segmented
          options={SORT_OPTIONS}
          value={criteria.sort}
          onChange={onSort}
          variant="solid"
          height={28}
          className={classes.sort}
        />
      </div>
      <div className={clsx(classes.chips, utils.noScrollbar)}>
        {TOGGLES.map((t) => (
          <ToggleChip key={t.key} toggle={t} active={criteria.flags.includes(t.key)} onToggle={onToggle} />
        ))}
      </div>
    </>
  );
});
