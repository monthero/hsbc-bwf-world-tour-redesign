import { clsx } from 'clsx'
import type { FC } from 'react'

import classes from './QualifyLine.module.css'

export const QualifyLine: FC<{ label: string; className?: string }> = ({ label, className }) => (
  <span className={clsx(classes.line, className)}>{label}</span>
)
