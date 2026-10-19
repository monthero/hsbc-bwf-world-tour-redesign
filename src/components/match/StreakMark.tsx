import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { IconFire, Tip } from '~/components/ui';
import { STREAK_LABEL } from '~/utils/live';

import classes from './StreakMark.module.css';
import utils from '~/styles/utils.module.css';

export const StreakMark = memo<{ n: number; className?: string }>(({ n, className }) => {
  const { i18n } = useLingui();
  const label = i18n._({ ...STREAK_LABEL, values: { n } });
  return (
    <Tip label={label}>
      <span className={clsx(utils.raise, classes.streak, className)} aria-label={label}>
        <IconFire className={classes.icon} />
        {n}
      </span>
    </Tip>
  );
});
