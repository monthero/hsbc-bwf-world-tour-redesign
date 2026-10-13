import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { memo } from 'react'

import { LEVEL_VARS } from '~/constants'
import type { Tournament } from '~/types'
import { tournamentParams } from '~/utils/tournaments'

import classes from './TournamentChip.module.css'
import utils from '~/styles/utils.module.css'

export const TournamentChip = memo<{ tournament: Tournament; variant?: 'glass' | 'outline'; className?: string }>(
  ({ tournament: t, variant = 'outline', className }) => {
    return (
      <Link
        to="/world-tour/$year/$slug"
        params={tournamentParams(t)}
        className={clsx(variant === 'glass' && utils.glassTag, classes.chip, className)}
        data-variant={variant}
        style={LEVEL_VARS[t.level]}
      >
        {t.name}
      </Link>
    )
  },
)
