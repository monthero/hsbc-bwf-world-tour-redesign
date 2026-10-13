import { Tooltip } from '@mantine/core'
import { Link, type LinkProps } from '@tanstack/react-router'
import { clsx } from 'clsx'
import type { FC, HTMLAttributes, ReactNode, Ref } from 'react'

import classes from './IconButton.module.css'

export const IconButton: FC<
  Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'onClick'> & {
    ref?: Ref<HTMLAnchorElement & HTMLButtonElement>
    label: string
    children: ReactNode
    size?: 'sm' | 'md'
    shape?: 'circle' | 'rounded'
    variant?: 'ghost' | 'outline' | 'filled'
    tip?: string
    disabled?: boolean
    className?: string
    onClick?: () => void
    link?: LinkProps
  }
> = ({
  ref,
  label,
  children,
  size = 'md',
  shape = 'circle',
  variant = 'outline',
  tip,
  disabled,
  className,
  onClick,
  link,
  ...rest
}) => {
  const props = {
    ...rest,
    ref,
    className: clsx(classes.iconButton, className),
    'data-size': size,
    'data-shape': shape,
    'data-variant': variant,
    'aria-label': label,
  }
  const el =
    link && !disabled ? (
      <Link {...link} {...props}>
        {children}
      </Link>
    ) : (
      <button type="button" {...props} aria-disabled={disabled || undefined} onClick={disabled ? undefined : onClick}>
        {children}
      </button>
    )
  return tip ? <Tooltip label={tip}>{el}</Tooltip> : el
}
