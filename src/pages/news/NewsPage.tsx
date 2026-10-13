import { Button } from '@mantine/core'
import { clsx } from 'clsx'
import { Fragment, useCallback, useEffect, useMemo, useRef, type FC } from 'react'

import { useNewsFeed, useNewsIndex } from '~/api/news'
import type { NewsIndex } from '~/api/schemas'
import { PopularNews, SubscribeCard } from '~/components/news'
import { EmptyState, PageHeader } from '~/components/ui'
import { SEASON_YEAR } from '~/constants'
import { useDocumentTitle } from '~/hooks/useDocumentTitle'
import { useIsMobile } from '~/hooks/useIsMobile'
import { useTournamentLookup } from '~/hooks/useNews'
import { monthKeyOf, monthOf } from '~/utils/dates'
import { toStory } from '~/utils/news'

import { LatestSection } from './components/LatestSection'
import { MonthChips } from './components/MonthChips'
import { MonthRail } from './components/MonthRail'
import { MonthSection } from './components/MonthSection'
import {
  INITIAL_MONTHS,
  LATEST_COUNT,
  monthSectionId,
  NAV_GAP,
  NEWS_META,
  NEWS_TITLE,
  OFFICIAL_NEWS_URL,
  POPULAR_COUNT,
  SECTION,
} from './constants'
import type { MonthGroup, NavItem } from './types'
import { useSectionSpy } from './useSectionSpy'

import classes from './NewsPage.module.css'
import utils from '~/styles/utils.module.css'

const TITLE_SITE = { season: SEASON_YEAR }

const LEAD_NAV: readonly NavItem[] = [
  { id: SECTION.latest, label: 'Latest', short: 'Latest' },
  { id: SECTION.popular, label: 'Most popular', short: 'Popular' },
]

export const NewsPage: FC = () => {
  useDocumentTitle('News', TITLE_SITE)
  const isMobile = useIsMobile()
  const { data, isError, refetch } = useNewsIndex()
  const retry = useCallback(() => void refetch(), [refetch])
  return (
    <div className={classes.page}>
      <PageHeader kicker="News" title={NEWS_TITLE} meta={NEWS_META} />
      {isError && !data ? (
        <div className={utils.container}>
          <EmptyState className={classes.error}>
            <p>Couldn’t load the latest news.</p>
            <span className={classes.errorActions}>
              <Button variant="default" radius="xl" onClick={retry}>
                Try again
              </Button>
              <Button
                component="a"
                href={OFFICIAL_NEWS_URL}
                target="_blank"
                rel="noreferrer"
                variant="subtle"
                radius="xl"
              >
                Read on the official site
              </Button>
            </span>
          </EmptyState>
        </div>
      ) : (
        <Feed index={data} isMobile={isMobile} />
      )}
    </div>
  )
}

const Feed: FC<{ index: NewsIndex | undefined; isMobile: boolean }> = ({ index, isMobile }) => {
  const lookup = useTournamentLookup()
  const barRef = useRef<HTMLDivElement>(null)
  const { active, register, jump } = useSectionSpy(isMobile ? NAV_GAP.mobile : NAV_GAP.desktop, barRef)
  const popularRef = useCallback((el: HTMLElement | null) => register(SECTION.popular, el), [register])

  const latest = useMemo(() => index?.latest.slice(0, LATEST_COUNT).map((i) => toStory(i, lookup)), [index, lookup])
  const popular = useMemo(() => index?.popular.slice(0, POPULAR_COUNT).map((i) => toStory(i, lookup)), [index, lookup])

  const feed = useNewsFeed()
  const { pages, months, hasNextPage, fetchNextPage, isFetchingNextPage } = feed
  const failed = feed.isError && !!index
  const pending = !!index && (feed.isLoading || isFetchingNextPage || failed)
  const currentKey = index ? monthKeyOf(index.asOf) : ''

  useEffect(() => {
    if (pages.length && pages.length < INITIAL_MONTHS && hasNextPage && !isFetchingNextPage && !failed) fetchNextPage()
  }, [pages.length, hasNextPage, isFetchingNextPage, failed, fetchNextPage])

  const groups = useMemo<MonthGroup[]>(() => {
    const counts = months.slice(0, pages.length + (pending ? 1 : 0))
    return counts.map((m, i) => {
      const month = monthOf(m.month)
      const page = pages[i]
      return {
        key: m.month,
        id: monthSectionId(m.month),
        name: month.format('MMMM'),
        year: month.year(),
        total: m.count,
        stories: page?.items.map((it) => toStory(it, lookup)),
        failed: !page && failed,
      }
    })
  }, [months, pages, pending, failed, lookup])

  const monthNav = useMemo<NavItem[] | undefined>(
    () =>
      index &&
      groups.map((g) => {
        const sameYear = g.year === monthOf(currentKey).year()
        const short = monthOf(g.key).format(sameYear ? 'MMM' : 'MMM YY')
        return { id: g.id, label: sameYear ? g.name : `${g.name} ${g.year}`, short, count: g.total }
      }),
    [index, groups, currentKey],
  )
  const chips = useMemo(() => [...LEAD_NAV, ...(monthNav ?? [])], [monthNav])

  const next = hasNextPage && !pending ? months[pages.length] : undefined
  const onMore = next ? fetchNextPage : undefined

  return (
    <>
      {isMobile && <MonthChips ref={barRef} items={chips} active={active} onJump={jump} onMore={onMore} />}
      <div className={utils.container}>
        <LatestSection stories={latest} isMobile={isMobile} register={register} />
        {(!index || !!popular?.length) && <PopularNews stories={popular} ref={popularRef} />}
      </div>
      <div className={clsx(utils.container, classes.feed)}>
        {!isMobile && <MonthRail items={monthNav} active={active} onJump={jump} onMore={onMore} />}
        <main className={classes.months}>
          {groups.map((g, i) => (
            <Fragment key={g.key}>
              <MonthSection
                group={g}
                current={g.key === currentKey}
                isMobile={isMobile}
                register={register}
                onRetry={fetchNextPage}
              />
              {isMobile && i === 0 && <SubscribeCard compact className={classes.subscribe} />}
            </Fragment>
          ))}
          {next && (
            <Button variant="default" radius="xl" size="md" className={classes.more} onClick={fetchNextPage}>
              {`Load ${monthOf(next.month).format('MMMM YYYY')}`}
            </Button>
          )}
        </main>
      </div>
    </>
  )
}
