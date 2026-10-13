import { clsx } from 'clsx'
import type { FC } from 'react'

import classes from './LiveDot.module.css'

export const LiveDot: FC<{ pulse?: boolean; size?: number; className?: string }> = ({ pulse, size = 7, className }) => {
  return (
    <span className={clsx(classes.liveDot, pulse && classes.pulse, className)} style={{ width: size, height: size }} />
  )
}
