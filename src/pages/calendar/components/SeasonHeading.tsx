import type { FC } from 'react'

import type { SeasonSummary } from '~/types'
import { finalsCity } from '~/utils/tournaments'

export const SeasonHeading: FC<{ season: SeasonSummary }> = ({ season }) => (
  <>
    Road to <span>{finalsCity(season.finals)}</span>
  </>
)
