import { Link } from '@tanstack/react-router'
import { memo, useCallback, useMemo } from 'react'

import { IconTrophy } from '~/components/ui'
import { LEVEL_VARS } from '~/constants'
import { tournamentParams } from '~/utils/tournaments'

import type { OnActive, PinSpot, SeasonFocus } from '../types'
import { anchorVars } from '../utils'

import classes from './MapPin.module.css'

export const MapPin = memo<{
  spot: PinSpot
  focus: SeasonFocus
  active: boolean
  interactive: boolean
  onActive: OnActive
  onLeave: () => void
}>(({ spot, focus, active, interactive, onActive, onLeave }) => {
  const t = spot.t
  const style = useMemo(() => ({ ...LEVEL_VARS[t.level], ...anchorVars(spot) }), [t.level, spot])
  const enter = useCallback(() => onActive(t.code), [onActive, t.code])
  const attrs = {
    className: classes.pin,
    style,
    'data-status': t.status,
    'data-spot': t === focus.spot || undefined,
    'data-finals': t === focus.finals || undefined,
    'data-active': active || undefined,
    'data-compact': !interactive || undefined,
  }
  const dot = <span className={classes.dot}>{t === focus.finals && <IconTrophy size={11} />}</span>
  if (!interactive) return <span {...attrs}>{dot}</span>
  return (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      tabIndex={-1}
      aria-label={t.name}
      onPointerEnter={enter}
      onPointerLeave={onLeave}
      {...attrs}
    >
      {dot}
    </Link>
  )
})
