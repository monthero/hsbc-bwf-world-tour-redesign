import { Trans, useLingui } from '@lingui/react/macro';
import { memo, useMemo, type FC } from 'react';

import {
  CondensedBar,
  FilterField,
  FilterSheet,
  IconButton,
  IconSort,
  OptionPicker,
  type PickOption,
  type SheetTriggerProps,
} from '~/components/ui';
import type { TournamentDay } from '~/types';

import { SORT_LABELS, SORT_TITLE } from '../../constants';
import type { MatchSort } from '../../types';
import {
  ClearButton,
  CourtChips,
  DaySegment,
  Divider,
  EventChips,
  FilterSearch,
  FollowToggle,
  SortChips,
  type FilterVariant,
} from './FilterControls';
import type { MatchFilters } from './useMatchFilters';
import type { MatchesView } from './utils';

import classes from './FilterBars.module.css';

const PillDay: FC<{ day: TournamentDay }> = ({ day: { shortLabel: day, month } }) => (
  <span>
    <Trans comment="Selected day on the phone filters button, e.g. “Wed 15 Oct”. {day} is the weekday and day number, {month} the short month">
      {day} {month}
    </Trans>
  </span>
);

const SORT_ICON: Record<Exclude<FilterVariant, 'sheet'>, number> = { inline: 16, compact: 14 };

const SortControl = memo<{
  sorts: MatchSort[];
  sort: MatchSort;
  onChange: (sort: MatchSort) => void;
  variant: Exclude<FilterVariant, 'sheet'>;
}>(({ sorts, sort, onChange, variant }) => {
  const { i18n } = useLingui();
  const options = useMemo(
    (): PickOption<MatchSort>[] => sorts.map((value) => ({ value, label: i18n._(SORT_LABELS[value]) })),
    [sorts, i18n],
  );
  const title = i18n._(SORT_TITLE);
  return (
    <OptionPicker
      options={options}
      value={sort}
      onChange={onChange}
      title={title}
      position="bottom-end"
      renderTrigger={(sheet?: SheetTriggerProps) => (
        <IconButton
          label={title}
          tip={sheet ? undefined : title}
          size={variant === 'compact' ? 'sm' : 'md'}
          active={sort !== 'time'}
          {...sheet}
        >
          <IconSort size={SORT_ICON[variant]} />
        </IconButton>
      )}
    />
  );
});

interface BarProps {
  filters: MatchFilters;
  view: MatchesView;
}

export const InlineFilters = memo<BarProps & { ref: (el: HTMLDivElement | null) => void }>(
  ({ filters: f, view, ref }) => {
    return (
      <div ref={ref} className={classes.inline}>
        <EventChips className={classes.inlineChips} variant="inline" chips={view.evChips} onToggle={f.toggleEvent} />
        {view.courtChips.length > 0 && (
          <>
            <Divider fade className={classes.desktopOnly} />
            <CourtChips
              className={classes.inlineChips}
              variant="inline"
              chips={view.courtChips}
              onToggle={f.toggleCourt}
            />
          </>
        )}
        {f.hasFilters && <ClearButton variant="inline" onClick={f.clear} />}
        <div className={classes.searchWrap}>
          <FilterSearch variant="inline" value={f.q} onChange={f.setQ} />
          <FollowToggle variant="inline" active={f.following} onToggle={f.toggleFollowing} />
          {view.sorts.length > 1 && (
            <SortControl variant="inline" sorts={view.sorts} sort={view.sort} onChange={f.setSort} />
          )}
        </div>
      </div>
    );
  },
);

export const CondensedFilters = memo<BarProps & { days: TournamentDay[]; visible: boolean }>(
  ({ filters: f, view, days, visible }) => {
    return (
      <CondensedBar visible={visible}>
        <DaySegment variant="compact" days={days} day={f.day} onChange={f.setDay} />
        <Divider />
        <EventChips variant="compact" chips={view.evChips} onToggle={f.toggleEvent} />
        {view.courtChips.length > 0 && (
          <>
            <Divider fade />
            <CourtChips variant="compact" chips={view.courtChips} onToggle={f.toggleCourt} />
          </>
        )}
        {f.hasFilters && <ClearButton variant="compact" onClick={f.clear} />}
        <FilterSearch variant="compact" value={f.q} onChange={f.setQ} />
        <FollowToggle variant="compact" active={f.following} onToggle={f.toggleFollowing} />
        {view.sorts.length > 1 && (
          <SortControl variant="compact" sorts={view.sorts} sort={view.sort} onChange={f.setSort} />
        )}
      </CondensedBar>
    );
  },
);

export const MobileFilters = memo<BarProps & { days: TournamentDay[]; visible: boolean }>(
  ({ filters: f, view, days, visible }) => {
    const { i18n } = useLingui();
    const d = days[f.day];
    return (
      <FilterSheet
        visible={visible}
        count={f.count}
        summary={d ? <PillDay day={d} /> : null}
        clear={f.hasFilters && <ClearButton variant="sheet" onClick={f.clear} />}
      >
        <FilterField label={<Trans comment="Match filters: label above the tournament day picker">Day</Trans>}>
          <DaySegment variant="sheet" days={days} day={f.day} onChange={f.setDay} />
        </FilterField>
        <FilterField
          label={<Trans comment="Match filters: label above the event chips (MS, WS, MD, WD, XD)">Category</Trans>}
        >
          <EventChips variant="sheet" chips={view.evChips} onToggle={f.toggleEvent} />
        </FilterField>
        {view.courtChips.length > 0 && (
          <FilterField label={<Trans comment="Match filters: label above the court number chips">Court</Trans>}>
            <CourtChips variant="sheet" chips={view.courtChips} onToggle={f.toggleCourt} />
          </FilterField>
        )}
        {view.sorts.length > 1 && (
          <FilterField label={i18n._(SORT_TITLE)}>
            <SortChips variant="sheet" sorts={view.sorts} sort={view.sort} onChange={f.setSort} />
          </FilterField>
        )}
        <div className={classes.searchRow}>
          <FilterSearch variant="sheet" value={f.q} onChange={f.setQ} />
          <FollowToggle variant="sheet" active={f.following} onToggle={f.toggleFollowing} />
        </div>
      </FilterSheet>
    );
  },
);
