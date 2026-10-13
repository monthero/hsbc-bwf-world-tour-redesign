import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type MouseEvent } from 'react'

import { LEVEL_VARS } from '~/constants'
import type { Tournament } from '~/types'
import { date } from '~/utils/dates'

import type { OnActive, SeasonFocus } from '../types'

import classes from './SeasonWheel.module.css'
import utils from '~/styles/utils.module.css'

const centerOf = (wheel: HTMLElement, el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2 - wheel.clientWidth / 2

const WheelItem = memo<{
  tournament: Tournament
  month: string | null
  selected: boolean
  isSpot: boolean
  isToday: boolean
  onPick: (e: MouseEvent<HTMLButtonElement>) => void
}>(({ tournament: t, month, selected, isSpot, isToday, onPick }) => (
  <button
    type="button"
    className={classes.item}
    style={LEVEL_VARS[t.level]}
    data-code={t.code}
    data-status={t.status}
    data-spot={isSpot || undefined}
    data-today={isToday || undefined}
    aria-pressed={selected}
    aria-label={`${t.name}, ${t.dates}`}
    onClick={onPick}
  >
    {month && <span className={classes.month}>{month}</span>}
    <i />
    <span className={utils.num}>{date(t.start).date()}</span>
  </button>
))

export const SeasonWheel = memo<{
  tournaments: Tournament[]
  focus: SeasonFocus
  selected: Tournament | undefined
  onSelect: OnActive
}>(({ tournaments, focus, selected, onSelect }) => {
  const ref = useRef<HTMLDivElement>(null)
  const current = useRef(selected?.code)
  useLayoutEffect(() => {
    current.current = selected?.code
  }, [selected])
  const items = useMemo(
    () =>
      tournaments.map((t, i) => {
        const m = date(t.start).month()
        const prev = tournaments[i - 1]
        return { t, month: !prev || date(prev.start).month() !== m ? date(t.start).format('MMM') : null }
      }),
    [tournaments],
  )
  const todayIndex = useMemo(
    () => tournaments.findIndex((t) => t.status === 'live' || t.status === 'up'),
    [tournaments],
  )

  useLayoutEffect(() => {
    const wheel = ref.current
    const el = wheel?.querySelector<HTMLElement>(`[data-code="${current.current}"]`)
    if (wheel && el) wheel.scrollLeft = centerOf(wheel, el)
  }, [])

  useEffect(() => {
    const wheel = ref.current
    if (!wheel) return
    let raf = 0
    const pick = () => {
      const mid = wheel.scrollLeft + wheel.clientWidth / 2
      let best: HTMLElement | null = null
      let dist = Infinity
      for (const el of wheel.children as HTMLCollectionOf<HTMLElement>) {
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid)
        if (d < dist) {
          dist = d
          best = el
        }
      }
      const code = best?.dataset.code
      if (code && code !== current.current) onSelect(code)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(pick)
    }
    wheel.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      wheel.removeEventListener('scroll', onScroll)
    }
  }, [onSelect])

  const onPick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const wheel = ref.current
    if (wheel) wheel.scrollTo({ left: centerOf(wheel, e.currentTarget), behavior: 'smooth' })
  }, [])

  return (
    <div className={classes.wrap}>
      <div ref={ref} className={classes.wheel}>
        {items.map(({ t, month }, i) => (
          <WheelItem
            key={t.code}
            tournament={t}
            month={month}
            selected={t === selected}
            isSpot={t === focus.spot}
            isToday={i === todayIndex}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  )
})
