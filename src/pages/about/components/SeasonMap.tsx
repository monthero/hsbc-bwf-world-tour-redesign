import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import type { Tournament } from '~/types'

import { ANCHOR_PX, CLOSE_DELAY, MAP_ASSET, MAP_SIZE, PIN_GAP_PX, WIDTH_STEP } from '../constants'
import type { OnActive, SeasonFocus } from '../types'
import { relaxPins, routePaths } from '../utils'
import { MapPin } from './MapPin'
import { MapPopover } from './MapPopover'

import classes from './SeasonMap.module.css'

const LAND_STYLE = { '--land': `url(${MAP_ASSET})` } as CSSProperties
const VIEWBOX = `0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`

const useStageWidth = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() =>
      setWidth(Math.max(WIDTH_STEP, Math.round(el.clientWidth / WIDTH_STEP) * WIDTH_STEP)),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export const SeasonMap = memo<{
  tournaments: Tournament[]
  focus: SeasonFocus
  active: Tournament | undefined
  interactive: boolean
  onActive: OnActive
}>(({ tournaments, focus, active, interactive, onActive }) => {
  const [ref, width] = useStageWidth()
  const gap = width ? ((interactive ? PIN_GAP_PX.desktop : PIN_GAP_PX.mobile) * MAP_SIZE.w) / width : 0
  const anchorR = width ? (ANCHOR_PX * MAP_SIZE.w) / width : 0
  const spots = useMemo(() => (gap ? relaxPins(tournaments, gap) : []), [tournaments, gap])
  const routes = useMemo(() => routePaths(tournaments), [tournaments])
  const shown = active ? spots.find((s) => s.t === active) : undefined
  const timer = useRef(0)

  const cancel = useCallback(() => window.clearTimeout(timer.current), [])
  const enter = useCallback<OnActive>(
    (code) => {
      window.clearTimeout(timer.current)
      onActive(code)
    },
    [onActive],
  )
  const leave = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onActive(null), CLOSE_DELAY)
  }, [onActive])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div
      ref={ref}
      className={classes.stage}
      style={LAND_STYLE}
      data-highlight={shown ? true : undefined}
      aria-hidden={interactive ? undefined : true}
    >
      <div className={classes.land} />
      <svg className={classes.routes} viewBox={VIEWBOX} preserveAspectRatio="none" aria-hidden>
        {routes.map((r) => (
          <path key={r.key} d={r.d} data-done={r.done || undefined} />
        ))}
        {spots.map(
          (s) =>
            s.moved && (
              <g key={s.t.code} className={classes.leader} data-active={s === shown || undefined}>
                <line x1={s.ax} y1={s.ay} x2={s.x} y2={s.y} />
                <circle cx={s.ax} cy={s.ay} r={anchorR} />
              </g>
            ),
        )}
      </svg>
      <div className={classes.pins}>
        {spots.map((s) => (
          <MapPin
            key={s.t.code}
            spot={s}
            focus={focus}
            active={s === shown}
            interactive={interactive}
            onActive={enter}
            onLeave={leave}
          />
        ))}
      </div>
      {interactive && shown && <MapPopover spot={shown} focus={focus} onEnter={cancel} onLeave={leave} />}
    </div>
  )
})
