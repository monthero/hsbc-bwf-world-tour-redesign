import { memo, type FC, type ReactNode } from 'react';

import type { StatItem } from '~/types';

import classes from './BioFacts.module.css';

const BORN_PREFIX = /^Born /;

type TileSize = 'sm' | 'md';

const Tile: FC<{ label: string; size: TileSize; tone: 'plain' | 'tile'; children: ReactNode }> = ({
  label,
  size,
  tone,
  children,
}) => (
  <div className={classes.tile} data-size={size} data-tone={tone}>
    <span className={classes.label}>{label}</span>
    {children}
  </div>
);

export const BioStat = memo<{ item: StatItem; size?: TileSize }>(({ item: s, size = 'md' }) => {
  return (
    <Tile label={s.label} size={size} tone="tile">
      <span className={classes.statLine}>
        <span className={classes.statValue}>{s.value}</span>
        {s.unit && <span className={classes.unit}>{s.unit}</span>}
        {s.inline && <span className={classes.inline}>{size === 'sm' ? `(${s.inline})` : s.inline}</span>}
      </span>
      {s.sub && <span className={classes.sub}>{size === 'sm' ? s.sub.replace(BORN_PREFIX, '') : s.sub}</span>}
    </Tile>
  );
});

export const FactTile = memo<{
  label: string;
  value: ReactNode;
  size?: TileSize;
  tone?: 'plain' | 'tile';
}>(({ label, value, size = 'md', tone = 'tile' }) => {
  return (
    <Tile label={label} size={size} tone={tone}>
      <span className={classes.value}>{value}</span>
    </Tile>
  );
});
