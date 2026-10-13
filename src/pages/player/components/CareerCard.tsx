import { Skeleton } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { memo, useCallback, useState, type CSSProperties } from 'react'

import { EventTag } from '~/components/match'
import { FactTile, Partner } from '~/components/player'
import { LogoTile, MedalCount } from '~/components/tournament'
import { Eyebrow, SectionTitle } from '~/components/ui'
import type { EventCode, PlayerMatch } from '~/types'
import { plural } from '~/utils/format'
import { tournamentParams } from '~/utils/tournaments'

import { MEDAL_TILES, TITLE_LIMIT } from '../constants'
import type { CareerView, SeasonView } from '../types'
import { teammateOf, winRate, winShare } from '../utils'
import { EventPicker } from './EventPicker'
import { ResultPill } from './ResultPill'
import { SeasonRecord } from './SeasonRecord'

import classes from './CareerCard.module.css'
import shared from './shared.module.css'
import utils from '~/styles/utils.module.css'

interface CareerCardProps {
  playerId: string
  career: CareerView
  events: readonly EventCode[]
  event: EventCode | undefined
  ready: boolean
  onSeason: (year: number) => void
  onEvent: (event: EventCode | undefined) => void
}

const rateStyle = (s: SeasonView) => ({ '--w': `${(winShare(s.wins, s.losses) ?? 0) * 100}%` }) as CSSProperties

export const CareerCard = memo<CareerCardProps>(({ playerId, career, events, event, ready, onSeason, onEvent }) => {
  if (!ready) return <Skeleton height={320} radius={18} />
  const { seasons, titles } = career
  const latest = seasons[0]?.year
  const first = seasons.at(-1)?.year
  if (!latest || !first) return null
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <SectionTitle
        aside={
          <span className={classes.sub}>
            {first === latest ? latest : `${first}–${latest}`} · {plural(seasons.length, 'season')}
          </span>
        }
      >
        World Tour career
      </SectionTitle>
      {events.length > 1 && <EventPicker events={events} value={event} onChange={onEvent} />}
      <div className={shared.tiles}>
        <FactTile
          label="Win–loss"
          value={
            <span className={utils.num}>
              {career.wins}–{career.losses} <span className={classes.rate}>{winRate(career.wins, career.losses)}</span>
            </span>
          }
        />
        {MEDAL_TILES.map((m) => (
          <MedalCount key={m.kind} kind={m.kind} label={m.label} count={career.counts[m.kind]} />
        ))}
      </div>
      <div className={classes.seasons}>
        {seasons.map((s) => (
          <SeasonRow key={s.year} season={s} onSeason={onSeason} />
        ))}
      </div>
      {titles.length > 0 && <Titles titles={titles} self={playerId} />}
    </div>
  )
})

const SeasonRow = memo<{ season: SeasonView; onSeason: (year: number) => void }>(({ season: s, onSeason }) => {
  const open = useCallback(() => onSeason(s.year), [onSeason, s.year])
  return (
    <button type="button" className={classes.row} onClick={open} aria-label={`See ${s.year} matches`}>
      <span className={clsx(utils.num, classes.year)}>{s.year}</span>
      <span className={classes.rowMain}>
        <SeasonRecord season={s} />
        <span className={classes.track}>
          <span className={classes.bar} style={rateStyle(s)} />
        </span>
      </span>
      {s.best && <ResultPill result={s.best} />}
    </button>
  )
})

const Titles = memo<{ titles: PlayerMatch[]; self: string }>(({ titles, self }) => {
  const [all, setAll] = useState(false)
  const showAll = useCallback(() => setAll(true), [])
  const hidden = all ? 0 : Math.max(0, titles.length - TITLE_LIMIT)
  return (
    <div className={classes.titles}>
      <Eyebrow>Titles</Eyebrow>
      <div className={classes.chips}>
        {(hidden ? titles.slice(0, TITLE_LIMIT) : titles).map((pm) => (
          <TitleChip key={pm.key} pm={pm} self={self} />
        ))}
        {hidden > 0 && (
          <button type="button" className={shared.more} onClick={showAll}>
            +{hidden} more
          </button>
        )}
      </div>
    </div>
  )
})

const TitleChip = memo<{ pm: PlayerMatch; self: string }>(({ pm, self }) => {
  const t = pm.tournament
  const partner = teammateOf(pm, self)
  return (
    <span className={classes.chip}>
      <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={classes.chipLink}>
        <LogoTile src={t.logo} name={t.name} size={22} flat />
        <span className={classes.chipName}>{t.shortTitle}</span>
      </Link>
      <EventTag event={pm.match.event} />
      {partner && <Partner player={partner} short />}
    </span>
  )
})
