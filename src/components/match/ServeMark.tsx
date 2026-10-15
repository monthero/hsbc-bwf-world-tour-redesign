import { clsx } from 'clsx';
import { memo, type CSSProperties } from 'react';

import { ShuttleIcon, Tip } from '~/components/ui';

import classes from './ServeMark.module.css';

export const ServeMark = memo<{ size?: number; className?: string }>(({ size = 14, className }) => (
  <Tip label="Serving">
    <span className={clsx(classes.serve, className)} style={{ '--serve': `${size}px` } as CSSProperties}>
      <ShuttleIcon />
    </span>
  </Tip>
));
