import { memo } from 'react';

import { Eyebrow } from '~/components/ui';

import type { ArchiveYear, PickMonth } from '../types';
import { MonthIndex } from './MonthIndex';

import classes from './MonthRail.module.css';

export const MonthRail = memo<{
  years: ArchiveYear[] | undefined;
  current: string | null;
  onPick: PickMonth;
}>(({ years, current, onPick }) => {
  return (
    <nav className={classes.rail} aria-label="Archive">
      <Eyebrow>Jump to</Eyebrow>
      <MonthIndex years={years} current={current} onPick={onPick} variant="rail" />
    </nav>
  );
});
