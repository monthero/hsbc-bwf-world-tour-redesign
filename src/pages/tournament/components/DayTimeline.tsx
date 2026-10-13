import { memo, useMemo, type FC } from 'react'

import { IconCheck, IconTimer, LiveDot } from '~/components/ui'
import type { Tournament, TournamentSchedule } from '~/types'
import { countdownLabel } from '~/utils/tournaments'

import { buildTimeline, type TimelineDay } from '../utils'
import { RestBreak } from './RestBreak'

import classes from './DayTimeline.module.css'

const StatusLabel: FC<{ tournament: Tournament; today: TimelineDay | undefined }> = ({ tournament: t, today }) => {
  if (t.status === 'done')
    return (
      <>
        <IconCheck size={14} />
        Completed
      </>
    )
  if (t.status === 'up')
    return (
      <>
        <IconTimer size={14} />
        {countdownLabel(t, 'in')}
      </>
    )
  return (
    <>
      <LiveDot pulse size={7} />
      <span>
        Day {t.dayNumber} of {t.totalDays}
        {today?.long && <span className={classes.phone}> · {today.long}</span>}
      </span>
    </>
  )
}

const DayItem = memo<{ d: TimelineDay }>(({ d }) =>
  d.rest ? (
    <li className={classes.rest}>
      <RestBreak label={d.rest} active={d.state === 'now'} />
    </li>
  ) : (
    <li className={classes.day} data-state={d.state}>
      <i className={classes.bar} />
      <small className={classes.date}>
        <span className={classes.dateFull}>{d.label}</span>
        <span className={classes.dateNum}>{d.num}</span>
      </small>
      <b className={classes.round}>
        {d.state === 'now' && <LiveDot pulse size={6} className={classes.dot} />}
        <span className={classes.long}>{d.long}</span>
        <span className={classes.short}>{d.short}</span>
      </b>
    </li>
  ),
)

export const DayTimeline = memo<{ tournament: Tournament; schedule: TournamentSchedule }>(
  ({ tournament: t, schedule }) => {
    const days = useMemo(() => buildTimeline(t.status, schedule), [t.status, schedule])
    const today = days.find((d) => d.state === 'now')
    return (
      <div className={classes.timeline}>
        <div className={classes.head} data-status={t.status}>
          <StatusLabel tournament={t} today={today} />
        </div>
        <ol className={classes.days}>
          {days.map((d) => (
            <DayItem key={d.key} d={d} />
          ))}
        </ol>
      </div>
    )
  },
)
