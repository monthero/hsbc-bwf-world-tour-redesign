import { useDisclosure } from '@mantine/hooks';
import { memo, useCallback, useRef } from 'react';

import { BottomSheet, FilterChip, IconCalendar, IconExpand } from '~/components/ui';

import type { ArchiveYear, PickMonth } from '../types';
import { MonthIndex } from './MonthIndex';

import classes from './MonthSheet.module.css';

export const MonthSheet = memo<{
  years: ArchiveYear[] | undefined;
  current: string | null;
  onPick: PickMonth;
}>(({ years, current, onPick }) => {
  const [open, { open: show, close }] = useDisclosure(false);
  const picked = useRef<string | null>(null);
  const pick = useCallback(
    (key: string) => {
      picked.current = key;
      close();
    },
    [close],
  );
  const onExited = useCallback(() => {
    const key = picked.current;
    picked.current = null;
    if (key) onPick(key);
  }, [onPick]);
  return (
    <>
      <FilterChip
        className={classes.trigger}
        disabled={!years}
        aria-label="Jump to month"
        aria-haspopup="dialog"
        onClick={show}
      >
        <IconCalendar size={16} />
        <IconExpand size={12} />
      </FilterChip>
      <BottomSheet opened={open} onClose={close} onExited={onExited} handle bodyClassName={classes.body}>
        <span className={classes.title}>Jump to month</span>
        <MonthIndex years={years} current={current} onPick={pick} variant="sheet" />
      </BottomSheet>
    </>
  );
});
