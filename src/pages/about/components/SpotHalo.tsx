import { clsx } from 'clsx';
import { memo } from 'react';

import classes from './SpotHalo.module.css';

export const SpotHalo = memo<{ live: boolean; solid?: boolean; className?: string }>(({ live, solid, className }) => (
  <span
    className={clsx(classes.spot, className)}
    data-live={live || undefined}
    data-solid={solid || undefined}
    aria-hidden
  />
));
