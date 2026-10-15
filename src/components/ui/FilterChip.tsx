import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef, CSSProperties, FC, ReactNode } from 'react';

import type { EventCode } from '~/types';

import { Tip } from './Tip';

import classes from './FilterChip.module.css';
import discipline from '~/styles/discipline.module.css';

export const FilterChip: FC<
  ComponentPropsWithoutRef<'button'> & {
    active?: boolean;
    size?: 'sm' | 'md' | 'lg';
    tone?: { color: string };
    dot?: boolean;
    tip?: ReactNode;
    event?: EventCode;
  }
> = ({ active, size, tone, dot, tip, event, className, style, ...rest }) => {
  const el = (
    <button
      type="button"
      className={clsx(classes.chip, event && discipline.tone, className)}
      data-event={event}
      data-active={active || undefined}
      data-size={size}
      data-tone={tone ? true : undefined}
      data-dot={dot || undefined}
      aria-pressed={active}
      style={tone ? ({ ...style, '--tone': tone.color } as CSSProperties) : style}
      {...rest}
    />
  );
  return tip ? (
    <Tip tap={false} label={tip}>
      {el}
    </Tip>
  ) : (
    el
  );
};
