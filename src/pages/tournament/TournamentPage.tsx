import { Loader } from '@mantine/core'
import { getRouteApi } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { useLayoutEffect, useMemo, useRef, type FC, type RefObject } from 'react'

import { MatchDetailModal } from '~/components/match'
import { BackPill, EmptyState } from '~/components/ui'
import { NOT_FOUND } from '~/constants'
import { TournamentContext } from '~/contexts'
import { useDocumentTitle } from '~/hooks/useDocumentTitle'
import { useSlideIn } from '~/hooks/useSlideIn'
import { useSchedule, useTournament } from '~/hooks/useTournaments'
import type { Tournament } from '~/types'
import { headerOffset, TABBAR_VAR } from '~/utils/layout'

import { DrawTab } from './components/DrawTab'
import { MatchesTab } from './components/MatchesTab'
import { MediaTab } from './components/MediaTab'
import { NewsTab } from './components/NewsTab'
import { OverviewTab } from './components/OverviewTab'
import { PlayersTab } from './components/PlayersTab'
import { PodiumTab } from './components/PodiumTab'
import { TabNav } from './components/TabNav'
import { TournamentHeader } from './components/TournamentHeader'
import { CANCELLED_NOTE } from './constants'
import { useCalendarBack, useCloseMatch, useTabData } from './hooks'
import { TournamentTab } from './types'
import { resolveTab } from './utils'

import classes from './TournamentPage.module.css'
import utils from '~/styles/utils.module.css'

const route = getRouteApi('/world-tour/$year/$slug')

const TABS = {
  overview: OverviewTab,
  matches: MatchesTab,
  draw: DrawTab,
  players: PlayersTab,
  podium: PodiumTab,
  media: MediaTab,
  news: NewsTab,
}

const useScrollToAnchor = (anchorRef: RefObject<HTMLElement | null>, key: number | null) => {
  const prevRef = useRef(key)
  useLayoutEffect(() => {
    const prev = prevRef.current
    prevRef.current = key
    if (key === null || prev === null || prev === key) return
    const anchor = anchorRef.current
    if (!anchor) return
    const top = anchor.getBoundingClientRect().bottom + window.scrollY - headerOffset()
    if (window.scrollY > top) window.scrollTo({ top })
  }, [anchorRef, key])
}

const usePublishHeight = (rootRef: RefObject<HTMLElement | null>, barRef: RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const root = rootRef.current
    const bar = barRef.current
    if (!root || !bar) return
    const ro = new ResizeObserver(() => root.style.setProperty(TABBAR_VAR, `${bar.offsetHeight}px`))
    ro.observe(bar)
    return () => ro.disconnect()
  }, [rootRef, barRef])
}

const TournamentView: FC<{
  tournament: Tournament
  prev: Tournament | undefined
  next: Tournament | undefined
}> = ({ tournament, prev, next }) => {
  const search = route.useSearch()
  const { data: schedule } = useSchedule(tournament)
  const closeMatch = useCloseMatch()
  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)

  const { draw, entries, available } = useTabData(tournament, schedule)
  const hasLive = useMemo(() => !!schedule?.matches.some((m) => m.status === 'P'), [schedule])
  const tab = resolveTab(search.tab, available, tournament.status)
  const match = useMemo(
    () => (search.match && schedule?.matches.find((m) => m.id === search.match)) || null,
    [schedule, search.match],
  )
  const tabIndex = schedule ? TournamentTab.options.indexOf(tab) : null

  useScrollToAnchor(anchorRef, tabIndex)
  useSlideIn(paneRef, tabIndex)
  usePublishHeight(rootRef, barRef)

  const Tab = TABS[tab]

  return (
    <TournamentContext value={tournament}>
      <div ref={rootRef}>
        <TournamentHeader tournament={tournament} prev={prev} next={next} schedule={schedule} />
        {tournament.cancelled ? (
          <section className={clsx(utils.container, classes.tabSection)}>
            <EmptyState>{CANCELLED_NOTE}</EmptyState>
          </section>
        ) : (
          <TabNav
            ref={barRef}
            anchorRef={anchorRef}
            tournament={tournament}
            tab={tab}
            available={available}
            hasLive={hasLive}
          />
        )}
        {schedule ? (
          <>
            <div ref={paneRef}>
              <Tab tournament={tournament} schedule={schedule} draw={draw} entries={entries} />
            </div>
            <MatchDetailModal match={match} tournament={tournament} onClose={closeMatch} />
          </>
        ) : (
          !tournament.cancelled && (
            <div className={classes.loading}>
              <Loader color="red" size="sm" />
            </div>
          )
        )}
      </div>
    </TournamentContext>
  )
}

export const TournamentPage: FC = () => {
  const { year, slug } = route.useParams()
  const { tournament, prev, next, isPending } = useTournament(year, slug)
  const back = useCalendarBack(Number(year))
  const missing = !tournament && !isPending
  useDocumentTitle(missing ? NOT_FOUND : tournament?.title, missing ? 'bwf' : { season: tournament?.year })
  if (tournament) return <TournamentView key={tournament.code} tournament={tournament} prev={prev} next={next} />
  return (
    <div className={classes.status}>
      {isPending ? (
        <Loader color="red" size="sm" />
      ) : (
        <>
          <p>We couldn’t find a tournament called “{slug}”.</p>
          <BackPill link={back.link}>{back.label}</BackPill>
        </>
      )}
    </div>
  )
}
