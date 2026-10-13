import { clsx } from 'clsx'
import type { FC, ReactNode } from 'react'

import classes from './Eyebrow.module.css'

export const Eyebrow: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
  return <span className={clsx(classes.eyebrow, className)}>{children}</span>
}
