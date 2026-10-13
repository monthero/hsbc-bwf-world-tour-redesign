import { Loader } from '@mantine/core'
import { clsx } from 'clsx'
import { memo, useCallback, useMemo, useState, type FC } from 'react'

import { VideoCard } from '~/components/media'
import { EmptyState, SectionTitle, Segmented, type SegmentedOption } from '~/components/ui'
import { useTournamentMedia } from '~/hooks/useTournamentMedia'
import type { Match } from '~/types'
import { roundName } from '~/utils/matches'

import type { TabProps } from '../types'
import { FilterSearch } from './matches/FilterControls'
import { buildMediaSections, mediaMatchesQuery, mediaRound, mediaRounds, type MediaSection } from './media/sections'

import page from '../TournamentPage.module.css'
import classes from './MediaTab.module.css'
import utils from '~/styles/utils.module.css'

const ALL = 'all'

const SectionBlock = memo<{ section: MediaSection; matchOf: ReadonlyMap<string, Match> }>(({ section, matchOf }) => {
  return (
    <section className={classes.section}>
      <SectionTitle count={section.count}>{section.title}</SectionTitle>
      {section.groups.map((g) => (
        <div key={g.key} className={classes.group}>
          {g.label && <h3 className={classes.groupLabel}>{g.label}</h3>}
          <div className={classes.grid}>
            {g.items.map((item) => (
              <VideoCard key={item.id} item={item} match={matchOf.get(item.id)} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
})

const tabMessage = (enabled: boolean, isError: boolean) => {
  if (!enabled) return 'Videos appear on BWF TV once the tournament starts.'
  return isError ? 'Couldn’t load videos from YouTube right now.' : 'No videos on BWF TV for this tournament yet.'
}

export const MediaTab: FC<TabProps> = ({ tournament }) => {
  const { items, matchOf, isLoading, isError, enabled } = useTournamentMedia(tournament)
  const [q, setQ] = useState('')
  const [stage, setStage] = useState(ALL)
  const rounds = useMemo(() => mediaRounds(items, matchOf), [items, matchOf])
  const searched = useMemo(() => items.filter((i) => mediaMatchesQuery(i, matchOf, q)), [items, matchOf, q])
  const byStage = useMemo(() => Map.groupBy(searched, (i) => mediaRound(i, matchOf)), [searched, matchOf])
  const options = useMemo(
    (): SegmentedOption<string>[] => [
      { value: ALL, label: 'All', disabled: !searched.length },
      ...rounds.map((r) => ({ value: r, label: roundName(r), disabled: !byStage.has(r) })),
    ],
    [rounds, searched, byStage],
  )
  const visible = useMemo(() => (stage === ALL ? searched : (byStage.get(stage) ?? [])), [stage, byStage, searched])
  const sections = useMemo(() => buildMediaSections(visible, matchOf, tournament), [visible, matchOf, tournament])
  const selectStage = useCallback((v: string | null) => setStage(v ?? ALL), [])
  return (
    <div className={clsx(utils.container, page.tabSection, classes.tab)}>
      {isLoading && (
        <div className={classes.loading}>
          <Loader size="sm" />
        </div>
      )}
      {!isLoading && !items.length && <EmptyState>{tabMessage(enabled, isError)}</EmptyState>}
      {items.length > 0 && (
        <div className={classes.filters}>
          {rounds.length > 0 && (
            <div className={clsx(utils.noScrollbar, classes.stages)}>
              <Segmented className={classes.stageSeg} options={options} value={stage} onChange={selectStage} />
            </div>
          )}
          <div className={classes.searchWrap}>
            <FilterSearch variant="inline" value={q} onChange={setQ} />
          </div>
        </div>
      )}
      {items.length > 0 && !sections.length && <EmptyState>No videos match these filters.</EmptyState>}
      {sections.map((s) => (
        <SectionBlock key={s.key} section={s} matchOf={matchOf} />
      ))}
    </div>
  )
}
