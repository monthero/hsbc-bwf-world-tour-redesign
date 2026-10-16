import { memo, type CSSProperties } from 'react';

import type { Tournament } from '~/types';

import classes from './SeasonCells.module.css';

const SeasonCell = memo<{
  tournament: Tournament;
  index: number;
  selected: boolean;
  onHover: (index: number, pointerType: string) => void;
  onActivate: (index: number) => void;
}>(({ tournament: t, index, selected, onHover, onActivate }) => {
  return (
    <button
      type="button"
      className={classes.cell}
      aria-label={t.name}
      data-status={t.status}
      data-final={t.level === 'Finals' || undefined}
      data-selected={selected || undefined}
      onPointerEnter={(e) => onHover(index, e.pointerType)}
      onFocus={() => onHover(index, 'mouse')}
      onClick={() => onActivate(index)}
    >
      <span />
    </button>
  );
});

export const SeasonCells = memo<{
  tournaments: Tournament[];
  size: 'sm' | 'md';
  selected: number;
  label?: string;
  onHover: (index: number, pointerType: string) => void;
  onActivate: (index: number) => void;
}>(({ tournaments, size, selected, label, onHover, onActivate }) => {
  const Tag = label ? 'nav' : 'div';
  return (
    <Tag
      className={classes.cells}
      dir="ltr"
      data-size={size}
      style={{ '--n': tournaments.length } as CSSProperties}
      aria-label={label}
    >
      {tournaments.map((t, i) => (
        <SeasonCell
          key={t.code}
          tournament={t}
          index={i}
          selected={i === selected}
          onHover={onHover}
          onActivate={onActivate}
        />
      ))}
    </Tag>
  );
});
