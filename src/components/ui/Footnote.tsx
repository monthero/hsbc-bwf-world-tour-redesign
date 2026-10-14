import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { IconInfo } from './icons';
import { TapTip } from './TapTip';

import classes from './Footnote.module.css';

export const Footnote: FC<{ note: string; children: ReactNode; className?: string }> = ({
  note,
  children,
  className,
}) => (
  <TapTip label={note}>
    <button type="button" className={clsx(classes.trigger, className)} aria-label={note}>
      {children}
      <IconInfo className={classes.icon} aria-hidden />
    </button>
  </TapTip>
);
