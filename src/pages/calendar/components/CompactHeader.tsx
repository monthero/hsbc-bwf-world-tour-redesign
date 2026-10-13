import { clsx } from 'clsx'
import { memo } from 'react'

import type { SeasonSummary, Tournament } from '~/types'

import { SeasonBar } from './SeasonBar'
import { SeasonHeading } from './SeasonHeading'

import classes from './CompactHeader.module.css'
import utils from '~/styles/utils.module.css'

export const CompactHeader = memo<{
  visible: boolean
  tournaments: Tournament[]
  season: SeasonSummary
  isMobile: boolean
}>(({ visible, tournaments, season, isMobile }) => {
  return (
    <header
      className={clsx(utils.glass, classes.header)}
      data-visible={visible || undefined}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className={clsx(utils.container, classes.inner)}>
        <div className={classes.summary}>
          <span className={classes.title}>
            <SeasonHeading season={season} />
          </span>
          <span className={classes.meta}>
            {season.phase !== 'current' && `${season.year} · `}
            <span className={classes.done}>{season.done}</span> of {season.total} stops
            {season.liveCount > 0 && (
              <>
                {' · '}
                <span className={classes.live}>{season.liveCount} live</span>
              </>
            )}
          </span>
        </div>
        <SeasonBar
          tournaments={tournaments}
          size="sm"
          isMobile={isMobile}
          label="Season stops"
          className={classes.cells}
        />
      </div>
    </header>
  )
})
