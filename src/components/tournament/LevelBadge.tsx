import { clsx } from 'clsx';
import type { FC } from 'react';

import { LEVEL_META, LEVEL_VARS } from '~/constants';
import type { Level } from '~/types';

import classes from './LevelBadge.module.css';
import utils from '~/styles/utils.module.css';

export const LevelBadge: FC<{
  level: Level;
  long?: boolean;
  size?: 'sm' | 'md';
  variant?: 'tint' | 'glass';
  dot?: boolean;
  className?: string;
}> = ({ level, long, size = 'md', variant = 'tint', dot, className }) => {
  const m = LEVEL_META[level];
  return (
    <span
      className={clsx(classes.levelBadge, variant === 'glass' && utils.glassTag, className)}
      data-size={size}
      data-variant={variant}
      data-dot={dot || undefined}
      style={LEVEL_VARS[level]}
    >
      {long ? m.long : m.label}
    </span>
  );
};
