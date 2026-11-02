import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import classes from './MiniRow.module.css';

export const MiniRow: FC<{ open: boolean; className?: string; children: ReactNode }> = ({
  open,
  className,
  children,
}) => (
  <div className={classes.mini} data-open={open || undefined} inert={!open}>
    <div className={clsx(classes.row, className)}>{children}</div>
  </div>
);
