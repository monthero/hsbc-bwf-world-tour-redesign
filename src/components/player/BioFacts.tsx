import { memo, type ReactNode } from 'react';

import type { StatItem } from '~/types';

import classes from './BioFacts.module.css';

const BORN_PREFIX = /^Born /;

export const BioStat = memo<{ item: StatItem; size?: 'sm' | 'md' }>(({ item: s, size = 'md' }) => {
  return (
    <div className={classes.tile} data-size={size} data-tone="tile">
      <span className={classes.label}>{s.label}</span>
      <span className={classes.statLine}>
        <span className={classes.statValue}>{s.value}</span>
        {s.unit && <span className={classes.unit}>{s.unit}</span>}
        {s.inline && <span className={classes.inline}>{size === 'sm' ? `(${s.inline})` : s.inline}</span>}
      </span>
      {s.sub && <span className={classes.sub}>{size === 'sm' ? s.sub.replace(BORN_PREFIX, '') : s.sub}</span>}
    </div>
  );
});

export const FactTile = memo<{
  label: string;
  value: ReactNode;
  size?: 'sm' | 'md';
  tone?: 'plain' | 'tile';
}>(({ label, value, size = 'md', tone = 'tile' }) => {
  return (
    <div className={classes.tile} data-size={size} data-tone={tone}>
      <span className={classes.label}>{label}</span>
      <span className={classes.value}>{value}</span>
    </div>
  );
});
