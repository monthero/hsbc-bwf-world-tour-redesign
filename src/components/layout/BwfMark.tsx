import { clsx } from 'clsx'
import type { FC } from 'react'

import { FAN_ZONE } from './links'

import classes from './BwfMark.module.css'

export const BwfMark: FC<{ className?: string }> = ({ className }) => (
  <a
    href={FAN_ZONE.href}
    target="_blank"
    rel="noreferrer"
    className={clsx(classes.mark, className)}
    aria-label="BWF (opens in a new tab)"
  />
)
