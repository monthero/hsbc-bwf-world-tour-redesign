import { clsx } from 'clsx'
import type { FC, ReactNode } from 'react'

import { IconStar, IconStarFilled } from './icons'

import classes from './StarButton.module.css'

export type StarVariant = 'ghost' | 'outline' | 'pill' | 'glass'
export type StarBox = 'sm' | 'md' | 'lg'

export const StarButton: FC<{
  active: boolean
  implied?: boolean
  label: string
  size?: number
  box?: StarBox
  variant?: StarVariant
  className?: string
  onClick: () => void
  children?: ReactNode
}> = ({ active, implied, label, size = 16, box = 'md', variant = 'ghost', className, onClick, children }) => {
  return (
    <button
      type="button"
      className={clsx(classes.star, className)}
      data-variant={variant}
      data-box={box}
      data-active={active || undefined}
      data-implied={implied || undefined}
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {active ? <IconStarFilled size={size} /> : <IconStar size={size} />}
      {children && <span className={classes.starLabel}>{children}</span>}
    </button>
  )
}
