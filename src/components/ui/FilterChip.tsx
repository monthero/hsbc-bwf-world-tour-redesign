import { Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef, CSSProperties, FC, ReactNode } from 'react';

import classes from './FilterChip.module.css';

export const FilterChip: FC<
  ComponentPropsWithoutRef<'button'> & {
    active?: boolean;
    size?: 'sm' | 'md' | 'lg';
    tone?: { color: string };
    dot?: boolean;
    tip?: ReactNode;
  }
> = ({ active, size, tone, dot, tip, className, style, ...rest }) => {
  const el = (
    <button
      type="button"
      className={clsx(classes.chip, className)}
      data-active={active || undefined}
      data-size={size}
      data-tone={tone ? true : undefined}
      data-dot={dot || undefined}
      aria-pressed={active}
      style={tone ? ({ ...style, '--tone': tone.color } as CSSProperties) : style}
      {...rest}
    />
  );
  return tip ? <Tooltip label={tip}>{el}</Tooltip> : el;
};
