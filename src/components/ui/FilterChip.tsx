import { clsx } from 'clsx'
import type { ComponentPropsWithoutRef, CSSProperties, FC } from 'react'

import classes from './FilterChip.module.css'

export const FilterChip: FC<
  ComponentPropsWithoutRef<'button'> & {
    active?: boolean
    size?: 'sm' | 'md' | 'lg'
    tone?: { color: string }
    dot?: boolean
  }
> = ({ active, size, tone, dot, className, style, ...rest }) => {
  return (
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
  )
}
