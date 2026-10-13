import { clsx } from 'clsx';
import { memo } from 'react';

import { IconTimer } from './icons';

import classes from './Duration.module.css';

export const Duration = memo<{ min: number; size?: number; className?: string }>(({ min, size = 13, className }) =>
  min ? (
    <span className={clsx(classes.duration, className)} title={`${min} minutes`}>
      <IconTimer size={size} />
      {min}′
    </span>
  ) : null,
);
