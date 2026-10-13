import { Skeleton, Tooltip } from '@mantine/core'
import { clsx } from 'clsx'
import { memo, useCallback, useMemo, type CSSProperties, type FC } from 'react'

import { FormStrip, TeamPlayers } from '~/components/match'
import { BioStat, FactTile, Partner } from '~/components/player'
import { CardHit, EmptyState, Eyebrow, IconExternal, SectionTitle } from '~/components/ui'
import { EVENT_NAMES, SEASON_YEAR } from '~/constants'
import type { BioView, EventCode, PlayerMatch } from '~/types'
import { formatNumber } from '~/utils/format'
import { roundName } from '~/utils/matches'
import { opponentsOf, outcomeLabel, recentForm } from '~/utils/season'

import { RECENT_LIMIT, RESULT_TAGS } from '../constants'
import type { CareerView, HistoryView, PartnerRow, SeasonView } from '../types'
import { resultLabel, resultTier, teammateOf } from '../utils'
import { CareerCard } from './CareerCard'
import { PartnersCard } from './PartnersCard'

import classes from './OverviewTab.module.css'
import shared from './shared.module.css'
import utils from '~/styles/utils.module.css'

interface OverviewTabProps {
  playerId: string
  season: SeasonView | undefined
  career: CareerView
  events: readonly EventCode[]
  event: EventCode | undefined
  partners: PartnerRow[]
  ready: boolean
  bio: BioView
  history: HistoryView | undefined
  historyLoading: boolean
  onOpenMatch: (pm: PlayerMatch) => void
  onSeason: (year: number) => void
  onEvent: (event: EventCode | undefined) => void
  onResults: () => void
}

const NO_MATCHES: PlayerMatch[] = []

const FORM_SKELETON = Array.from({ length: RECENT_LIMIT }, (_, i) => i)

const formOutcome = (pm: PlayerMatch): 'W' | 'L' => (pm.outcome === 'W' ? 'W' : 'L')

const formTip = (pm: PlayerMatch) =>
  `${pm.outcome === 'W' ? 'Won' : 'Lost'} vs ${opponentsOf(pm)
    .map((p) => p.name)
    .join(' / ')} · ${pm.tournament.shortTitle}`

const barStyle = (points: number, max: number) =>
  ({ '--h': `${Math.max(5, Math.round((points / max) * 100))}%` }) as CSSProperties

export const OverviewTab: FC<OverviewTabProps> = ({
  playerId,
  season,
  career,
  events,
  event,
  partners,
  ready,
  bio,
  history,
  historyLoading,
  onOpenMatch,
  onSeason,
  onEvent,
  onResults,
}) => {
  const matches = season?.matches ?? NO_MATCHES
  const upNext = matches.find((pm) => pm.outcome === 'up' || pm.outcome === 'Live')
  const hasPersonal = bio.stats.length > 0 || bio.details.length > 0 || bio.links.length > 0
  const hasAbout = !!bio.ambition || bio.notes.length > 0
  const hasExtra = bio.equipment.length > 0 || hasAbout
  return (
    <div className={shared.stack}>
      {(hasPersonal || hasExtra) && (
        <div className={clsx(shared.grid2, classes.top)}>
          {hasPersonal && <PersonalDetails bio={bio} />}
          {hasExtra && (
            <div className={shared.stack}>
              {bio.equipment.length > 0 && (
                <div className={clsx(utils.card, shared.panel)}>
                  <SectionTitle>Equipment</SectionTitle>
                  <div className={classes.grid}>
                    {bio.equipment.map((q) => (
                      <FactTile key={q.key} label={q.label} value={q.value} tone="tile" />
                    ))}
                  </div>
                </div>
              )}
              {hasAbout && <About bio={bio} />}
            </div>
          )}
        </div>
      )}
      {(!ready || season) && (
        <div className={shared.grid2}>
          {upNext && <UpNext pm={upNext} self={playerId} multi={events.length > 1} onOpen={onOpenMatch} />}
          <FormCard season={season} ready={ready} onOpen={onOpenMatch} />
        </div>
      )}
      <CareerCard
        playerId={playerId}
        career={career}
        events={events}
        event={event}
        ready={ready}
        onSeason={onSeason}
        onEvent={onEvent}
      />
      {partners.length > 0 && <PartnersCard rows={partners} />}
      <RankingGlance history={history} loading={historyLoading} onResults={onResults} />
    </div>
  )
}

const UpNext = memo<{ pm: PlayerMatch; self: string; multi: boolean; onOpen: (pm: PlayerMatch) => void }>(
  ({ pm, self, multi, onOpen }) => {
    const open = useCallback(() => onOpen(pm), [onOpen, pm])
    const partner = teammateOf(pm, self)
    return (
      <div className={clsx(utils.live, classes.upNext)}>
        <CardHit label={`Open match details · ${pm.tournament.shortTitle}`} onClick={open} />
        <Eyebrow className={classes.upNextLabel}>Up next · {pm.tournament.shortTitle}</Eyebrow>
        <span className={classes.upNextOpps}>
          <span className={classes.vs}>vs</span>
          <TeamPlayers players={opponentsOf(pm)} flag="md" layout="inline" />
        </span>
        <span className={classes.upNextMeta}>
          {roundName(pm.match.round)}
          {multi && ` · ${EVENT_NAMES[pm.match.event]}`} · {outcomeLabel(pm)}
          {partner && <Partner player={partner} />}
        </span>
      </div>
    )
  },
)

const FormCard = memo<{
  season: SeasonView | undefined
  ready: boolean
  onOpen: (pm: PlayerMatch) => void
}>(({ season, ready, onOpen }) => {
  const matches = season?.matches ?? NO_MATCHES
  const form = useMemo(() => recentForm(matches, RECENT_LIMIT), [matches])
  const items = useMemo(
    () => form.map((pm) => ({ key: pm.key, outcome: formOutcome(pm), tip: formTip(pm), onClick: () => onOpen(pm) })),
    [form, onOpen],
  )
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <Eyebrow>
        {SEASON_YEAR} form · last {items.length}
      </Eyebrow>
      {!ready && (
        <div className={classes.formSkeleton}>
          {FORM_SKELETON.map((i) => (
            <Skeleton key={i} height={38} radius={9} />
          ))}
        </div>
      )}
      {ready && items.length > 0 && (
        <>
          <FormStrip items={items} variant="tile" />
          <span className={classes.formFoot}>Oldest → newest · tap for match</span>
        </>
      )}
      {ready && !items.length && <EmptyState variant="note">No completed matches this season.</EmptyState>}
    </div>
  )
})

const RankingGlance = memo<{
  history: HistoryView | undefined
  loading: boolean
  onResults: () => void
}>(({ history, loading, onResults }) => {
  const group = history?.results[0]
  const items = useMemo(() => (group ? group.items.toReversed() : []), [group])
  if (loading) return <Skeleton height={260} radius={18} />
  if (!group || items.length < 2) return null
  const max = Math.max(1, ...items.map((t) => t.points))
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <SectionTitle
        aside={
          <button type="button" className={shared.more} onClick={onResults}>
            All results
          </button>
        }
      >
        Last 52 weeks
      </SectionTitle>
      <span className={classes.glanceSub}>Ranking points per event · {EVENT_NAMES[group.ev]}</span>
      <div className={classes.bars}>
        {items.map((t) => (
          <Tooltip key={t.key} label={`${t.name} · ${resultLabel(t.result)} · ${formatNumber(t.points)}`}>
            <div className={classes.barCol} data-tier={resultTier(t.result)}>
              <span className={classes.barTag}>{RESULT_TAGS[t.result]}</span>
              <span className={classes.bar} style={barStyle(t.points, max)} />
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  )
})

const PersonalDetails = memo<{ bio: BioView }>(({ bio }) => {
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <SectionTitle aside={bio.links.length > 0 && <SocialLinks bio={bio} />}>Personal details</SectionTitle>
      <div className={classes.grid}>
        {bio.stats.map((s) => (
          <BioStat key={s.key} item={s} />
        ))}
        {bio.details.map((f) => (
          <FactTile key={f.key} label={f.label} value={f.value} />
        ))}
      </div>
    </div>
  )
})

const SocialLinks = memo<{ bio: BioView }>(({ bio }) => {
  return (
    <span className={classes.links}>
      {bio.links.map((l) => (
        <a key={l.key} href={l.value} target="_blank" rel="noreferrer" className={classes.social}>
          {l.label}
          <IconExternal size={12} />
        </a>
      ))}
    </span>
  )
})

const About = memo<{ bio: BioView }>(({ bio }) => {
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <SectionTitle>About</SectionTitle>
      {bio.ambition && <p className={classes.ambition}>“{bio.ambition}”</p>}
      {bio.notes.map((n) => (
        <FactTile key={n.key} label={n.label} value={n.value} size="sm" tone="plain" />
      ))}
    </div>
  )
})
