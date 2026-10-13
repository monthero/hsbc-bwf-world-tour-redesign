import { clsx } from 'clsx'
import { memo, type FC, type ReactNode } from 'react'

import { LogoTile, TournamentHoverCard, TournamentPlace, TournamentStatusBadge } from '~/components/tournament'
import { BackPill, IconBack, IconButton, IconNext, MediaCover } from '~/components/ui'
import { LEVEL_META, LEVEL_VARS } from '~/constants'
import type { Tournament, TournamentSchedule } from '~/types'
import { tournamentParams } from '~/utils/tournaments'

import { useCalendarBack } from '../hooks'
import { DayTimeline } from './DayTimeline'

import classes from './TournamentHeader.module.css'
import utils from '~/styles/utils.module.css'

const RoundButton: FC<{
  from: Tournament
  target: Tournament | undefined
  dir: 'Previous' | 'Next'
  edge: string
  children: ReactNode
}> = ({ from, target, dir, edge, children }) => {
  const other = !!target && target.year !== from.year
  const label = target ? `${dir}: ${other ? target.heading : target.title}` : edge
  return (
    <TournamentHoverCard tournament={target} kicker={other ? `${dir} season` : `${dir} event`}>
      <IconButton
        label={label}
        tip={target ? undefined : label}
        disabled={!target}
        link={target && { to: '/world-tour/$year/$slug', params: tournamentParams(target) }}
      >
        {children}
      </IconButton>
    </TournamentHoverCard>
  )
}

export const TournamentHeader = memo<{
  tournament: Tournament
  prev: Tournament | undefined
  next: Tournament | undefined
  schedule: TournamentSchedule | undefined
}>(({ tournament: t, prev, next, schedule }) => {
  const back = useCalendarBack(t.year)
  return (
    <header className={clsx(utils.container, classes.header)} style={LEVEL_VARS[t.level]}>
      <div className={classes.top}>
        <BackPill link={back.link}>{back.label}</BackPill>
        <nav className={classes.rounds} aria-label="Other tournaments">
          <RoundButton from={t} target={prev} dir="Previous" edge="First event on record">
            <IconBack size={16} />
          </RoundButton>
          <RoundButton from={t} target={next} dir="Next" edge="Last event of the season">
            <IconNext size={16} />
          </RoundButton>
        </nav>
      </div>
      <MediaCover src={t.header} position="center 40%" muted={t.cancelled} className={classes.banner}>
        {t.cancelled && <TournamentStatusBadge tournament={t} variant="overlay" className={classes.cancelled} />}
      </MediaCover>
      <div className={classes.body}>
        <LogoTile src={t.logo} size="var(--logo)" alt={t.name} flat className={classes.logo} />
        <h1 className={classes.title}>
          {t.heading} {t.subtitle && <span className={classes.subtitle}>{t.subtitle}</span>}
        </h1>
        <div className={classes.meta}>
          <span className={classes.dates}>{t.dates}</span>
          <TournamentPlace tournament={t} />
          {t.venue && <span>{t.venue}</span>}
          <span className={classes.chip}>
            <b className={classes.level}>
              {LEVEL_META[t.level].long}
              {t.level !== 'Finals' && <span className={classes.series}>World Tour</span>}
            </b>
            <span className={classes.prize}>
              <strong>{t.prizeLabel}</strong>
              <span className={classes.prizeWord}> prize money</span>
            </span>
          </span>
        </div>
      </div>
      {schedule && <DayTimeline tournament={t} schedule={schedule} />}
    </header>
  )
})
