import { Tooltip } from '@mantine/core'
import { clsx } from 'clsx'
import type { FC } from 'react'

import classes from './SeedTag.module.css'

export const SEED_TIP = 'seeded by world ranking and placed apart in the draw so top entries can’t meet early'

export const SeedTag: FC<{
  seed: number | null | undefined
  variant?: 'inline' | 'pill'
  className?: string
}> = ({ seed, variant = 'inline', className }) => {
  if (!seed) return null
  return (
    <Tooltip label={`Seed ${seed} · ${SEED_TIP}`}>
      <span className={clsx(classes.seed, className)} data-variant={variant}>
        {variant === 'pill' ? `Seed ${seed}` : `(${seed})`}
      </span>
    </Tooltip>
  )
}
