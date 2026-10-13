import { clsx } from 'clsx'
import { memo, type CSSProperties, type FC } from 'react'

import { Flag } from '~/components/country'
import { PlayerAvatar, PlayerName } from '~/components/player'
import { SectionTitle } from '~/components/ui'
import type { Player } from '~/types'
import { plural } from '~/utils/format'

import type { NationTitles, TitlesSummary } from '../types'

import classes from './TitlesSoFar.module.css'
import utils from '~/styles/utils.module.css'

const NationBar = memo<{ nation: NationTitles }>(({ nation: n }) => (
  <li className={classes.bar} style={{ '--w': `${n.share * 100}%` } as CSSProperties}>
    <Flag cc={n.cc} />
    <span className={classes.cc}>{n.cc}</span>
    <span className={classes.track} />
    <span className={clsx(utils.num, classes.n)}>{n.titles}</span>
  </li>
))

const leadText = (others: number, most: number) =>
  others ? ` and ${plural(others, 'other')} lead with ${most} titles each` : ` leads with ${plural(most, 'title')}`

const Leader: FC<{ leaders: Player[]; most: number }> = ({ leaders, most }) => {
  const [p] = leaders
  if (!p) return null
  return (
    <p className={classes.leader}>
      <PlayerAvatar player={p} size={32} link />
      <span className={classes.leadText}>
        <PlayerName player={p} className={classes.leadName} />
        {leadText(leaders.length - 1, most)}
      </span>
      <Flag cc={p.cc} />
    </p>
  )
}

export const TitlesSoFar = memo<{ summary: TitlesSummary }>(({ summary: s }) => (
  <div className={clsx(utils.card, classes.card)}>
    <SectionTitle as="h3" count={`${plural(s.events, 'event')} · ${plural(s.titles, 'title')}`}>
      Titles so far
    </SectionTitle>
    <ol className={classes.bars}>
      {s.nations.map((n) => (
        <NationBar key={n.cc} nation={n} />
      ))}
    </ol>
    <Leader leaders={s.leaders} most={s.most} />
  </div>
))
