import { Trans, useLingui } from '@lingui/react/macro';
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
  const { t } = useLingui();
  return (
    <nav
      className={classes.rail}
      aria-label={t({
        message: 'Archive',
        comment: 'Screen-reader label for the news page sidebar listing past months of stories',
      })}
    >
      <Eyebrow>
        <Trans comment="News page sidebar heading above the list of years and months to jump to">Jump to</Trans>
      </Eyebrow>
      <MonthIndex years={years} current={current} onPick={onPick} variant="rail" />
    </nav>
  );
});
