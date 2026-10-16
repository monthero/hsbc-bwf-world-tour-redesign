import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { memo, useCallback, useState } from 'react';

import { FilterChip } from '~/components/ui';
import { monthOf } from '~/utils/dates';

import { SKELETON_COUNT } from '../constants';
import type { ArchiveMonth, ArchiveYear, PickMonth } from '../types';
import { monthShort } from '../utils';

import classes from './MonthIndex.module.css';
import utils from '~/styles/utils.module.css';

const SLOTS = Array.from({ length: SKELETON_COUNT.rail }, (_, i) => i);

const MONTH_LABEL = msg({
  message: '{count, plural, one {{label}, # story} other {{label}, # stories}}',
  comment: 'Screen-reader label for a month in the news archive picker: {label} is a month and year',
});

const MONTH_TIP = msg({
  message: '{count, plural, one {{label} · # story} other {{label} · # stories}}',
  comment: 'Tooltip on a month in the news archive picker: {label} is a month and year',
});

const MonthCell = memo<{ month: ArchiveMonth | null; slot: number; active: boolean; onPick: PickMonth }>(
  ({ month, slot, active, onPick }) => {
    const { i18n } = useLingui();
    const onClick = useCallback(() => month && onPick(month.key), [onPick, month]);
    const label = month?.label;
    const count = month?.count ?? 0;
    return (
      <FilterChip
        size="sm"
        active={active}
        disabled={!month}
        aria-current={active || undefined}
        aria-label={month ? i18n._({ ...MONTH_LABEL, values: { count, label } }) : undefined}
        tip={month ? i18n._({ ...MONTH_TIP, values: { count, label } }) : undefined}
        className={classes.month}
        onClick={onClick}
      >
        {monthShort(slot)}
      </FilterChip>
    );
  },
);

const YearItem = memo<{
  entry: ArchiveYear;
  open: boolean;
  current: string | null;
  onToggle: (year: number) => void;
  onPick: PickMonth;
}>(({ entry, open, current, onToggle, onPick }) => {
  const onClick = useCallback(() => onToggle(entry.year), [onToggle, entry.year]);
  const active = !!current && entry.months.some((m) => m?.key === current);
  return (
    <li>
      <button
        type="button"
        className={classes.year}
        data-active={active || undefined}
        aria-expanded={open}
        onClick={onClick}
      >
        {entry.year}
        <span className={utils.num}>{entry.total}</span>
      </button>
      {open && (
        <div className={classes.months}>
          {entry.months.map((m, i) => (
            <MonthCell key={i} month={m} slot={i} active={!!m && m.key === current} onPick={onPick} />
          ))}
        </div>
      )}
    </li>
  );
});

export const MonthIndex = memo<{
  years: ArchiveYear[] | undefined;
  current: string | null;
  onPick: PickMonth;
  variant: 'rail' | 'sheet';
}>(({ years, current, onPick, variant }) => {
  const currentYear = current ? monthOf(current).year() : years?.[0]?.year;
  const [open, setOpen] = useState(currentYear);
  const [seen, setSeen] = useState(currentYear);
  if (seen !== currentYear) {
    setSeen(currentYear);
    setOpen(currentYear);
  }
  const onToggle = useCallback((year: number) => setOpen((y) => (y === year ? undefined : year)), []);
  return (
    <ol className={classes.list} data-variant={variant}>
      {years
        ? years.map((y) => (
            <YearItem
              key={y.year}
              entry={y}
              open={y.year === open}
              current={current}
              onToggle={onToggle}
              onPick={onPick}
            />
          ))
        : SLOTS.map((i) => (
            <li key={i} className={classes.slot}>
              <Skeleton height={14} width="70%" radius={6} />
            </li>
          ))}
    </ol>
  );
});
