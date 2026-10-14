import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useRef, type Ref } from 'react';

import { FilterChip, StickyBar } from '~/components/ui';
import { centerChild } from '~/utils/scroll';

import { SECTION } from '../constants';
import type { ArchiveYear, NavItem, PickMonth } from '../types';
import { MonthSheet } from './MonthSheet';

import classes from './MonthChips.module.css';
import utils from '~/styles/utils.module.css';

const MonthChip = memo<{ item: NavItem; active: boolean; onJump: (id: string) => void }>(({ item, active, onJump }) => {
  const onClick = useCallback(() => onJump(item.id), [onJump, item.id]);
  return (
    <FilterChip active={active} data-id={item.id} onClick={onClick} className={classes.chip}>
      {item.short}
      {item.count !== undefined && <span className={clsx(utils.num, classes.count)}>{item.count}</span>}
    </FilterChip>
  );
});

export const MonthChips = memo<{
  ref: Ref<HTMLDivElement>;
  items: NavItem[];
  active: string | null;
  onJump: (id: string) => void;
  years: ArchiveYear[] | undefined;
  month: string | null;
  onPick: PickMonth;
}>(({ ref, items, active, onJump, years, month, onPick }) => {
  const row = useRef<HTMLDivElement>(null);
  const current = active ?? SECTION.latest;

  useEffect(() => {
    const el = row.current;
    const chip = el?.querySelector<HTMLElement>(`[data-id="${current}"]`);
    if (!el || !chip) return;
    centerChild(el, chip, 'smooth');
  }, [current]);

  return (
    <StickyBar ref={ref} glass className={classes.bar}>
      <div className={classes.picker}>
        <MonthSheet years={years} current={month} onPick={onPick} />
      </div>
      <div ref={row} className={clsx(utils.noScrollbar, classes.row)}>
        {items.map((it) => (
          <MonthChip key={it.id} item={it} active={it.id === current} onJump={onJump} />
        ))}
      </div>
    </StickyBar>
  );
});
