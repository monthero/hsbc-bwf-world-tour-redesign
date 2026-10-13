import { clsx } from 'clsx'
import { memo } from 'react'

import { plural } from '~/utils/format'

import type { SeasonView } from '../types'
import { winRate } from '../utils'

import classes from './SeasonRecord.module.css'
import utils from '~/styles/utils.module.css'

export const SeasonRecord = memo<{ season: Pick<SeasonView, 'wins' | 'losses' | 'titles'>; className?: string }>(
  ({ season: s, className }) => {
    return (
      <span className={clsx(utils.num, classes.record, className)}>
        <b>
          {s.wins}–{s.losses}
        </b>
        <span>{winRate(s.wins, s.losses)}</span>
        {s.titles > 0 && <span className={classes.titles}>{plural(s.titles, 'title')}</span>}
      </span>
    )
  },
)
