import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { LIVE_DATA } from '~/constants'
import { dayjs } from '~/utils/dates'

import { ApiError, fetchJson, getJson } from './client'
import {
  type CalendarEventDto,
  NewsArticle,
  NewsIndex,
  type NewsItem,
  NewsMonth,
  type NewsMonthCount,
  NewsTournament,
} from './schemas'

const STATIC = { staleTime: Infinity, gcTime: Infinity }
const RECENT_MS = 10 * 60_000
const FREEZE_DAYS = 30
const NO_MONTHS: NewsMonthCount[] = []
const NO_ITEMS: NewsItem[] = []
const NO_PAGES: NewsMonth[] = []

const isRecentMonth = (month: string) => month >= dayjs.utc().subtract(FREEZE_DAYS, 'day').format('YYYY-MM')

const fetchIndex = (signal: AbortSignal) =>
  LIVE_DATA ? getJson('/news-api/index', NewsIndex, signal) : fetchJson('news/index.json', NewsIndex, signal)

const isRecentEvent = (end: string) => dayjs.utc(end).add(FREEZE_DAYS, 'day').isAfter(dayjs.utc())

const fetchTournament = (code: string, signal: AbortSignal) =>
  LIVE_DATA
    ? getJson(`/news-api/tournament/${code}`, NewsTournament, signal)
    : fetchJson(`news/tournaments/${code}.json`, NewsTournament, signal)

const fetchMonth = (month: string, signal: AbortSignal) =>
  LIVE_DATA
    ? getJson(`/news-api/month/${month}`, NewsMonth, signal)
    : fetchJson(`news/${month}.json`, NewsMonth, signal)

const ARTICLE_ID = /^\d+$/
const NOT_FOUND = 404
const MAX_RETRIES = 3

const fetchArticle = async (id: string, signal: AbortSignal) => {
  const url = LIVE_DATA ? `/news-api/article/${id}` : `${import.meta.env.BASE_URL}data/news/articles/${id}.json`
  if (!ARTICLE_ID.test(id)) throw new ApiError(NOT_FOUND, url)
  const res = await fetch(url, { signal })
  const json = res.headers.get('content-type')?.includes('json') ?? false
  if (res.status === NOT_FOUND || (res.ok && !json)) throw new ApiError(NOT_FOUND, url)
  if (!res.ok) throw new ApiError(res.status, url)
  return NewsArticle.parse(await res.json())
}

export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === NOT_FOUND

const retryUnlessMissing = (count: number, error: unknown) => !isNotFound(error) && count < MAX_RETRIES

const isFrozenArticle = (a: NewsArticle) => dayjs.utc(a.publishedAt).add(FREEZE_DAYS, 'day').isBefore(dayjs.utc())

const selectItems = (d: NewsTournament) => d.items

const freshness = (recent: boolean) => (LIVE_DATA && recent ? { staleTime: RECENT_MS } : STATIC)

export const newsIndexQuery = () =>
  queryOptions({
    queryKey: ['news', 'index'],
    queryFn: ({ signal }) => fetchIndex(signal),
    ...(LIVE_DATA ? { staleTime: RECENT_MS, refetchInterval: RECENT_MS } : STATIC),
  })

export const newsMonthQuery = (month: string) =>
  queryOptions({
    queryKey: ['news', 'month', month],
    queryFn: ({ signal }) => fetchMonth(month, signal),
    ...freshness(isRecentMonth(month)),
  })

export const newsFeedQuery = (months: readonly NewsMonthCount[]) =>
  infiniteQueryOptions({
    queryKey: ['news', 'feed', months[0]?.month ?? '', months.length],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => fetchMonth(months[pageParam]?.month ?? '', signal),
    getNextPageParam: (_last: NewsMonth, pages: NewsMonth[]) =>
      pages.length < months.length ? pages.length : undefined,
    enabled: months.length > 0,
    ...freshness(true),
  })

type NewsEvent = Pick<CalendarEventDto, 'code' | 'end'>

export const tournamentNewsQuery = (t: NewsEvent) =>
  queryOptions({
    queryKey: ['news', 'tournament', t.code],
    queryFn: ({ signal }) => fetchTournament(t.code, signal),
    select: selectItems,
    ...freshness(isRecentEvent(t.end)),
  })

export const newsArticleQuery = (id: string) =>
  queryOptions({
    queryKey: ['news', 'article', id],
    queryFn: ({ signal }) => fetchArticle(id, signal),
    retry: retryUnlessMissing,
    ...(LIVE_DATA
      ? {
          staleTime: (q: { state: { data?: NewsArticle } }) =>
            q.state.data && isFrozenArticle(q.state.data) ? Infinity : RECENT_MS,
        }
      : STATIC),
  })

export const useNewsIndex = () => useQuery(newsIndexQuery())

export const useNewsArticle = (id: string) => useQuery(newsArticleQuery(id))

export const useNewsMonth = (month: string | undefined) =>
  useQuery({ ...newsMonthQuery(month ?? ''), enabled: !!month })

export const useTournamentNews = (t: NewsEvent) => useQuery(tournamentNewsQuery(t))

export interface NewsFeed {
  items: NewsItem[]
  pages: NewsMonth[]
  months: NewsMonthCount[]
  hasNextPage: boolean
  fetchNextPage: () => void
  isFetchingNextPage: boolean
  isLoading: boolean
  isError: boolean
}

export const useNewsFeed = (): NewsFeed => {
  const index = useNewsIndex()
  const months = index.data?.months ?? NO_MONTHS
  const feed = useInfiniteQuery(newsFeedQuery(months))
  const pages = feed.data?.pages
  const items = useMemo(() => pages?.flatMap((p) => p.items) ?? NO_ITEMS, [pages])
  const { fetchNextPage } = feed
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage])
  return {
    items,
    pages: pages ?? NO_PAGES,
    months,
    hasNextPage: feed.hasNextPage,
    fetchNextPage: loadMore,
    isFetchingNextPage: feed.isFetchingNextPage,
    isLoading: index.isLoading || feed.isLoading,
    isError: index.isError || feed.isError,
  }
}

const RELATED_COUNT = 4

const others = (items: readonly NewsItem[] | undefined, id: string) =>
  (items ?? NO_ITEMS).filter((i) => i.id !== id).slice(0, RELATED_COUNT)

export interface RelatedNews {
  tournament: NewsItem[]
  latest: NewsItem[]
  isLoading: boolean
}

export const useRelatedNews = (article: Pick<NewsArticle, 'id' | 'tournaments' | 'publishedAt'> | undefined) => {
  const code = article?.tournaments[0]
  const index = useNewsIndex()
  const tournament = useQuery({
    ...tournamentNewsQuery({ code: code ?? '', end: article?.publishedAt ?? '' }),
    enabled: !!code,
  })
  const id = article?.id ?? ''
  const tournamentItems = useMemo(() => others(tournament.data, id), [tournament.data, id])
  const latest = useMemo(() => others(index.data?.latest, id), [index.data, id])
  return useMemo(
    (): RelatedNews => ({
      tournament: tournamentItems,
      latest,
      isLoading: index.isLoading || (!!code && tournament.isLoading),
    }),
    [tournamentItems, latest, index.isLoading, code, tournament.isLoading],
  )
}
