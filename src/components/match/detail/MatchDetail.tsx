import { useMemo, type FC } from 'react'

import { MatchVideos } from '~/components/media'
import { IconButton, IconClose, LiveDot } from '~/components/ui'
import { EVENT_NAMES } from '~/constants'
import type { Match, Tournament } from '~/types'
import { allGames } from '~/utils/matches'

import { HeadToHead } from './HeadToHead'
import { StatsPanel } from './StatsPanel'
import { metaLine, statusLine } from './utils'

import classes from './MatchDetail.module.css'

export const MatchDetail: FC<{
  match: Match
  tournament: Tournament
  onClose: () => void
}> = ({ match, tournament, onClose }) => {
  const games = useMemo(() => allGames(match), [match])
  const live = match.status === 'P'
  return (
    <>
      <header className={classes.header}>
        <div className={classes.titles}>
          <span className={classes.tour}>{tournament.shortTitle}</span>
          <span className={classes.event}>{EVENT_NAMES[match.event]}</span>
          <span className={classes.meta}>{metaLine(match)}</span>
        </div>
        <IconButton label="Close" onClick={onClose}>
          <IconClose size={15} />
        </IconButton>
      </header>
      <div className={classes.status} data-live={live || undefined}>
        {live && <LiveDot pulse />}
        {statusLine(match)}
      </div>
      {games.length > 0 && <StatsPanel games={games} teams={match.teams} />}
      <MatchVideos match={match} tournament={tournament} />
      <HeadToHead match={match} tournament={tournament} />
    </>
  )
}
