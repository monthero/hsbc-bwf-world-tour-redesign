import { memo, useCallback, useState, type FC, type KeyboardEvent, type PointerEvent } from 'react'

import { Hero } from '~/pages/player/components/Hero'
import type { CareerHigh } from '~/pages/player/types'
import type { EventCode, Focus, Player, RankView } from '~/types'
import { heroVars } from '~/utils/images'

import { arrowNudge, clampPercent, useDrag, type FramingEditorProps } from './framing'
import { FramingControls } from './FramingControls'

import classes from './HeroFraming.module.css'

const NO_RANKS: RankView[] = []
const NO_HIGHS: ReadonlyMap<EventCode, CareerHigh> = new Map()
const CENTER: Focus = { x: 50, y: 50 }

const pointAt = (e: PointerEvent<HTMLElement>): Focus => {
  const r = e.currentTarget.getBoundingClientRect()
  return {
    x: clampPercent(((e.clientX - r.left) / r.width) * 100),
    y: clampPercent(((e.clientY - r.top) / r.height) * 100),
  }
}

const focusLabel = (focus: Focus | null) => (focus ? `Focus ${focus.x}% · ${focus.y}%` : 'Default framing')

const HeroPreview = memo<{ player: Player; hero: string; prize: string; focus: Focus | null }>(
  ({ player, hero, prize, focus }) => (
    <Hero player={player} hero={hero} seed={null} prize={prize} ranks={NO_RANKS} highs={NO_HIGHS} focus={focus} />
  ),
)

const FocusPad: FC<{
  image: string
  focus: Focus | null
  onDrag: (focus: Focus | null) => void
  onCommit: (focus: Focus) => void
}> = ({ image, focus, onDrag, onCommit }) => {
  const drag = useDrag(
    (e) => onDrag(pointAt(e)),
    (_, e) => onDrag(pointAt(e)),
    (_, e) => {
      onDrag(null)
      onCommit(pointAt(e))
    },
  )
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const nudge = arrowNudge(e)
    if (!nudge) return
    const from = focus ?? CENTER
    onCommit({ x: clampPercent(from.x + nudge.dx), y: clampPercent(from.y + nudge.dy) })
  }
  return (
    <button
      type="button"
      className={classes.pad}
      aria-label={`Hero focus point: ${focusLabel(focus)}. Click or drag, or use the arrow keys`}
      {...drag}
      onKeyDown={onKey}
    >
      <img src={image} alt="" draggable={false} referrerPolicy="no-referrer" className={classes.thumb} />
      {focus && <span className={classes.cross} style={{ left: `${focus.x}%`, top: `${focus.y}%` }} />}
    </button>
  )
}

export const HeroFraming = memo<
  FramingEditorProps<Focus> & {
    player: Player
    hero: string
    image: string
    prize?: string
  }
>(({ player, hero, image, focus, flip, prize = '', flipBlocked, busy = false, status, onChange }) => {
  const [drag, setDrag] = useState<Focus | null>(null)
  const shown = drag ?? focus
  const onCommit = useCallback((next: Focus) => onChange({ focus: next, flip }), [onChange, flip])
  const onFlip = useCallback((next: boolean) => onChange({ focus, flip: next }), [onChange, focus])
  const onReset = useCallback(() => onChange({ focus: null, flip: false }), [onChange])
  return (
    <div className={classes.framing}>
      <div className={classes.top}>
        <FocusPad image={image} focus={shown} onDrag={setDrag} onCommit={onCommit} />
        <span className={classes.mobile} style={heroVars(image, shown)} />
        <FramingControls
          title="Hero framing"
          readout={focusLabel(shown)}
          flip={flip}
          flipBlocked={flipBlocked}
          busy={busy}
          resettable={!!focus || flip}
          status={status}
          onFlip={onFlip}
          onReset={onReset}
        />
      </div>
      <HeroPreview player={player} hero={hero} prize={prize} focus={shown} />
    </div>
  )
})
