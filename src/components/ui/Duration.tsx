import { clsx } from 'clsx';
import { memo } from 'react';

import { IconTimer } from './icons';
import { Tip } from './Tip';

import classes from './Duration.module.css';

export const Duration = memo<{ min: number; size?: number; className?: string }>(({ min, size = 13, className }) =>
  min ? (
    <Tip label={`${min} minutes`}>
      <span className={clsx(classes.duration, className)}>
        <IconTimer size={size} />
        {min}′
      </span>
    </Tip>
  ) : null,
);
