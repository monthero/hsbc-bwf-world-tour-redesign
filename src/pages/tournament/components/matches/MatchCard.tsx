import { clsx } from 'clsx'
import { memo, type FC } from 'react'

import { FollowedMark } from '~/components/follow'
import { EventTag, SideScores, TeamPlayers } from '~/components/match'
import { CardHit, IconCheck } from '~/components/ui'
import type { Match, Player, Side } from '~/types'
import { formatDuration } from '~/utils/format'
import { isDoubles, noteLabel, sideResult } from '~/utils/matches'

import { matchTitle } from './utils'

import classes from './MatchCard.module.css'
import utils from '~/styles/utils.module.css'

const followedMark = (p: Player) => <FollowedMark id={p.id} />

const TeamRow: FC<{ match: Match; side: Side; doubles: boolean }> = ({ match: m, side, doubles }) => {
  const result = sideResult(m, side)
  const note = result === 'lost' ? noteLabel(m.note, 'short') : ''
  return (
    <div className={classes.team} data-result={result}>
      <div className={classes.who}>
        <TeamPlayers
          players={m.teams[side].players}
          seed={m.teams[side].seed}
          flag={doubles ? 'xs' : 'sm'}
          truncate
          after={followedMark}
          className={classes.players}
          nameClassName={classes.name}
        />
        {note && (
          <span className={classes.badge} title={noteLabel(m.note, 'long')}>
            {note}
          </span>
        )}
      </div>
      <IconCheck className={classes.check} />
      <SideScores match={m} side={side} slots={3} />
    </div>
  )
}

export const MatchCard = memo<{
  match: Match
  isNext: boolean
  onOpen: (id: string) => void
}>(({ match: m, isNext, onOpen }) => {
  const doubles = isDoubles(m.event)
  const meta =
    m.status === 'F' ? [noteLabel(m.note, 'long'), formatDuration(m.durationMin)].filter(Boolean).join(' · ') : ''
  return (
    <div className={clsx(utils.card, classes.card)} data-interactive data-doubles={doubles || undefined}>
      <CardHit label={`Match details: ${matchTitle(m)}`} onClick={() => onOpen(m.id)} />
      <div className={classes.head}>
        <span className={classes.when}>
          <span className={classes.time} data-up={m.status === 'N' || undefined}>
            {m.time}
          </span>
          <span className={classes.court}>Court {m.court}</span>
        </span>
        <span className={classes.tags}>
          {isNext && <span className={classes.next}>Next</span>}
          {meta && <span className={classes.meta}>{meta}</span>}
          <EventTag event={m.event} />
        </span>
      </div>
      <div className={classes.teams}>
        <TeamRow match={m} side={0} doubles={doubles} />
        <TeamRow match={m} side={1} doubles={doubles} />
      </div>
    </div>
  )
})
