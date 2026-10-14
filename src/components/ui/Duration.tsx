import { clsx } from 'clsx';
import { memo } from 'react';

import { IconTimer } from './icons';
import { TipSpan } from './TipSpan';

import classes from './Duration.module.css';

export const Duration = memo<{ min: number; size?: number; className?: string }>(({ min, size = 13, className }) =>
  min ? (
    <TipSpan className={clsx(classes.duration, className)} tip={`${min} minutes`}>
      <IconTimer size={size} />
      {min}′
    </TipSpan>
  ) : null,
);
