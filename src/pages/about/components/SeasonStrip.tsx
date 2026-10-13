import { Link } from '@tanstack/react-router'
import { memo, useCallback, useMemo, type KeyboardEvent } from 'react'

import { LEVEL_VARS } from '~/constants'
import type { Tournament } from '~/types'
import { today } from '~/utils/dates'
import { tournamentParams } from '~/utils/tournaments'

import type { OnActive, SeasonFocus } from '../types'
import { monthTicks, stripBox, todayOffset, yearSpan } from '../utils'

import classes from './SeasonStrip.module.css'

type Span = ReturnType<typeof yearSpan>

const StripMark = memo<{
  tournament: Tournament
  span: Span
  active: boolean
  isSpot: boolean
  isFinals: boolean
  onActive: OnActive
}>(({ tournament: t, span, active, isSpot, isFinals, onActive }) => {
  const style = useMemo(() => ({ ...LEVEL_VARS[t.level], ...stripBox(t, span) }), [t, span])
  const enter = useCallback(() => onActive(t.code), [onActive, t.code])
  const leave = useCallback(() => onActive(null), [onActive])
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onActive(null)
    },
    [onActive],
  )
  return (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      className={classes.mark}
      style={style}
      aria-label={`${t.name}, ${t.dates}`}
      data-status={t.status}
      data-spot={isSpot || undefined}
      data-finals={isFinals || undefined}
      data-active={active || undefined}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onKeyDown={onKeyDown}
    >
      <i />
    </Link>
  )
})

export const SeasonStrip = memo<{
  tournaments: Tournament[]
  year: number
  focus: SeasonFocus
  active: Tournament | undefined
  onActive: OnActive
}>(({ tournaments, year, focus, active, onActive }) => {
  const span = useMemo(() => yearSpan(year), [year])
  const ticks = useMemo(() => monthTicks(span), [span])
  const now = todayOffset(span)
  const month = now ? today().month() : -1
  const nowStyle = useMemo(() => (now ? { left: now } : undefined), [now])
  return (
    <nav className={classes.strip} aria-label={`${year} season timeline`} data-active={active ? true : undefined}>
      {ticks.map((m) => (
        <span key={m.month} className={classes.tick} style={m.style} data-now={m.month === month || undefined}>
          <span>{m.label}</span>
        </span>
      ))}
      {tournaments.map((t) => (
        <StripMark
          key={t.code}
          tournament={t}
          span={span}
          active={t === active}
          isSpot={t === focus.spot}
          isFinals={t === focus.finals}
          onActive={onActive}
        />
      ))}
      {nowStyle && (
        <span className={classes.today} style={nowStyle}>
          <span>Today</span>
        </span>
      )}
    </nav>
  )
})
