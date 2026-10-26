import { clsx } from 'clsx';
import type { CSSProperties, ReactNode } from 'react';

import type { EventCode } from '~/types';

import { Tip } from './Tip';

import classes from './Segmented.module.css';
import discipline from '~/styles/discipline.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  sub?: string;
  tip?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  muted?: boolean;
  disabled?: boolean;
  event?: EventCode;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  deselectable?: boolean;
  variant?: 'tint' | 'solid';
  height?: number;
  maxWidth?: number | string;
  center?: boolean;
  className?: string;
}

export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  deselectable,
  variant = 'tint',
  height = 36,
  maxWidth,
  center,
  className,
}: SegmentedProps<T>) => {
  const n = Math.max(1, options.length);
  const hit = options.findIndex((o) => o.value === value);
  const picked = options[hit]?.event;
  return (
    <div
      className={clsx(classes.root, picked && discipline.tone, className)}
      data-variant={variant}
      data-event={picked}
      data-center={center || undefined}
      style={{ '--n': n, '--i': Math.max(0, hit), '--h': `${height}px`, maxWidth } as CSSProperties}
    >
      <span className={classes.pill} data-hidden={hit < 0 || undefined} />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Tip tap={false} key={o.value} label={o.tip} disabled={!o.tip}>
            <button
              type="button"
              className={clsx(classes.option, o.event && discipline.tone)}
              data-event={o.event}
              data-muted={o.muted || undefined}
              disabled={o.disabled && !on}
              aria-pressed={on}
              onClick={() => onChange(on && deselectable ? null : o.value)}
            >
              {o.icon}
              {o.sub ? (
                <span className={classes.stack}>
                  {o.label}
                  <span className={classes.sub}>{o.sub}</span>
                </span>
              ) : (
                o.label
              )}
              {o.badge}
            </button>
          </Tip>
        );
      })}
    </div>
  );
};
