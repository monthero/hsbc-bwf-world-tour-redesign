import { memo, type FC, type ReactNode } from 'react';

import type { StatItem } from '~/types';

import { FactLabel, FactTip } from './FactLabel';

import classes from './BioFacts.module.css';

const BORN_PREFIX = /^Born /;

type TileSize = 'sm' | 'md';

const Tile: FC<{ id?: string; label: string; size: TileSize; tone: 'plain' | 'tile'; children: ReactNode }> = ({
  id = '',
  label,
  size,
  tone,
  children,
}) => (
  <FactTip id={id} label={label}>
    <div className={classes.tile} data-size={size} data-tone={tone}>
      <span className={classes.label}>
        <FactLabel id={id} label={label} size={size === 'sm' ? 14 : 16} />
      </span>
      {children}
    </div>
  </FactTip>
);

export const BioStat = memo<{ item: StatItem; size?: TileSize }>(({ item: s, size = 'md' }) => {
  return (
    <Tile id={s.key} label={s.label} size={size} tone="tile">
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
  id?: string;
  label: string;
  value: ReactNode;
  size?: TileSize;
  tone?: 'plain' | 'tile';
}>(({ id, label, value, size = 'md', tone = 'tile' }) => {
  return (
    <Tile id={id} label={label} size={size} tone={tone}>
      <span className={classes.value}>{value}</span>
    </Tile>
  );
});
