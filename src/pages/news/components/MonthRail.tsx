import { Button, Skeleton } from '@mantine/core';
import { memo, useCallback } from 'react';

import { Eyebrow } from '~/components/ui';

import { SKELETON_COUNT } from '../constants';
import type { NavItem } from '../types';

import classes from './MonthRail.module.css';
import utils from '~/styles/utils.module.css';

const SLOTS = Array.from({ length: SKELETON_COUNT.rail }, (_, i) => i);

const RailItem = memo<{ item: NavItem; active: boolean; onJump: (id: string) => void }>(({ item, active, onJump }) => {
  const onClick = useCallback(() => onJump(item.id), [onJump, item.id]);
  return (
    <li>
      <button
        type="button"
        className={classes.item}
        data-active={active || undefined}
        aria-current={active || undefined}
        onClick={onClick}
      >
        {item.label}
        <span className={utils.num}>{item.count}</span>
      </button>
    </li>
  );
});

export const MonthRail = memo<{
  items: NavItem[] | undefined;
  active: string | null;
  onJump: (id: string) => void;
  onMore?: () => void;
}>(({ items, active, onJump, onMore }) => {
  return (
    <nav className={classes.rail} aria-label="Months">
      <Eyebrow>Jump to</Eyebrow>
      <ol className={classes.list}>
        {items
          ? items.map((it) => <RailItem key={it.id} item={it} active={it.id === active} onJump={onJump} />)
          : SLOTS.map((i) => (
              <li key={i} className={classes.slot}>
                <Skeleton height={14} width="70%" radius={6} />
              </li>
            ))}
      </ol>
      {onMore && (
        <Button variant="default" radius="xl" fullWidth onClick={onMore}>
          Older stories
        </Button>
      )}
    </nav>
  );
});
