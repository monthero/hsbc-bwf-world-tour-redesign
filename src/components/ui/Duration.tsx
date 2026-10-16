import { Plural } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { IconTimer } from './icons';
import { Tip } from './Tip';

import classes from './Duration.module.css';

export const Duration = memo<{ min: number; size?: number; className?: string }>(({ min, size = 13, className }) =>
  min ? (
    <Tip
      label={<Plural value={min} one="# minute" other="# minutes" comment="Tooltip on a match duration, e.g. 42′" />}
    >
      <span className={clsx(classes.duration, className)}>
        <IconTimer size={size} />
        {min}′
      </span>
    </Tip>
  ) : null,
);
