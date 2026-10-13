import { clsx } from 'clsx'
import type { CSSProperties, FC, HTMLAttributes, Ref } from 'react'

import { HEADER_VAR } from '~/utils/layout'

import classes from './StickyBar.module.css'

export const StickyBar: FC<
  HTMLAttributes<HTMLDivElement> & {
    top?: number | string
    zIndex?: number
    glass?: boolean
    ref?: Ref<HTMLDivElement>
  }
> = ({ top = 0, zIndex = 20, glass, className, style, ref, ...rest }) => {
  return (
    <div
      ref={ref}
      className={clsx(classes.bar, className)}
      data-glass={glass || undefined}
      style={
        {
          ...style,
          top: `calc(var(${HEADER_VAR}) + ${typeof top === 'number' ? `${top}px` : top})`,
          zIndex,
        } as CSSProperties
      }
      {...rest}
    />
  )
}
