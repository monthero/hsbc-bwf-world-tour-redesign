import { clsx } from 'clsx'
import { memo, useMemo, useState } from 'react'

import { SectionTitle } from '~/components/ui'
import { useIsMobile } from '~/hooks/useIsMobile'
import type { Tournament } from '~/types'
import { isHeld } from '~/utils/tournaments'

import type { SeasonFocus } from '../types'
import { SeasonLegend } from './SeasonLegend'
import { SeasonMap } from './SeasonMap'
import { SeasonStrip } from './SeasonStrip'
import { SeasonWheel } from './SeasonWheel'
import { SelectedEvent } from './SelectedEvent'

import classes from './SeasonCard.module.css'
import utils from '~/styles/utils.module.css'

export const SeasonCard = memo<{ tournaments: Tournament[]; year: number; focus: SeasonFocus }>(
  ({ tournaments, year, focus }) => {
    const isMobile = useIsMobile()
    const [code, setCode] = useState<string | null>(null)
    const hovered = code ? tournaments.find((t) => t.code === code) : undefined
    const selected = isMobile ? (hovered ?? focus.focus) : undefined
    const active = isMobile ? selected : hovered
    const held = useMemo(() => tournaments.filter(isHeld), [tournaments])
    const done = held.filter((t) => t.status === 'done').length
    return (
      <section className={clsx(utils.card, classes.card)} aria-label={`${year} season map`}>
        <SectionTitle count={`${done} of ${held.length} completed`}>{`${year} season`}</SectionTitle>
        <div className={classes.mapWrap}>
          <SeasonMap
            tournaments={tournaments}
            focus={focus}
            active={active}
            interactive={!isMobile}
            onActive={setCode}
          />
          {!isMobile && <SeasonLegend compact={false} />}
        </div>
        {isMobile && <SeasonLegend compact />}
        {isMobile ? (
          <>
            <SeasonWheel tournaments={tournaments} focus={focus} selected={selected} onSelect={setCode} />
            {selected && <SelectedEvent tournament={selected} />}
          </>
        ) : (
          <SeasonStrip tournaments={tournaments} year={year} focus={focus} active={hovered} onActive={setCode} />
        )}
      </section>
    )
  },
)
