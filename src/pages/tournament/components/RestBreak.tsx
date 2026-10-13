import { Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import classes from './RestBreak.module.css';

export const RestBreak = memo<{ label: string; active?: boolean; className?: string }>(
  ({ label, active, className }) => (
    <Tooltip label={label}>
      <span className={clsx(classes.root, className)} data-active={active || undefined}>
        <span className={classes.text}>Rest</span>
      </span>
    </Tooltip>
  ),
);
