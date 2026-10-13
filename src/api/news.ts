import { queryOptions, useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { LIVE_NEWS } from '~/constants';
import { dayjs } from '~/utils/dates';

import { ApiError, fetchJson, getJson, hasStatus, retryUnless } from './client';
import {
  type CalendarEventDto,
  NewsArticle,
  NewsIndex,
  type NewsItem,
  NewsMonth,
  type NewsMonthCount,
  NewsTournament,
} from './schemas';

const STATIC = { staleTime: Infinity, gcTime: Infinity };
const RECENT_MS = 10 * 60_000;
const FREEZE_DAYS = 30;
const NO_ITEMS: NewsItem[] = [];

const isRecentMonth = (month: string) => month >= dayjs.utc().subtract(FREEZE_DAYS, 'day').format('YYYY-MM');

const fetchIndex = (signal: AbortSignal) =>
  LIVE_NEWS ? getJson('/news-api/index', NewsIndex, signal) : fetchJson('news/index.json', NewsIndex, signal);

const isRecentEvent = (end: string) => dayjs.utc(end).add(FREEZE_DAYS, 'day').isAfter(dayjs.utc());

const fetchTournament = (code: string, signal: AbortSignal) =>
  LIVE_NEWS
    ? getJson(`/news-api/tournament/${code}`, NewsTournament, signal)
    : fetchJson(`news/tournaments/${code}.json`, NewsTournament, signal);

const fetchMonth = (month: string, signal: AbortSignal) =>
  LIVE_NEWS
    ? getJson(`/news-api/month/${month}`, NewsMonth, signal)
    : fetchJson(`news/${month}.json`, NewsMonth, signal);

const ARTICLE_ID = /^\d+$/;
const NOT_FOUND = 404;

const fetchArticle = async (id: string, signal: AbortSignal) => {
  const url = LIVE_NEWS ? `/news-api/article/${id}` : `${import.meta.env.BASE_URL}data/news/articles/${id}.json`;
  if (!ARTICLE_ID.test(id)) throw new ApiError(NOT_FOUND, url);
  const res = await fetch(url, { signal });
  const json = res.headers.get('content-type')?.includes('json') ?? false;
  if (res.status === NOT_FOUND || (res.ok && !json)) throw new ApiError(NOT_FOUND, url);
  if (!res.ok) throw new ApiError(res.status, url);
  return NewsArticle.parse(await res.json());
};

export const isNotFound = (error: unknown) => hasStatus(error, NOT_FOUND);

const isFrozenArticle = (a: NewsArticle) => dayjs.utc(a.publishedAt).add(FREEZE_DAYS, 'day').isBefore(dayjs.utc());

const selectItems = (d: NewsTournament) => d.items;

const freshness = (recent: boolean) => (LIVE_NEWS && recent ? { staleTime: RECENT_MS } : STATIC);

export const newsIndexQuery = () =>
  queryOptions({
    queryKey: ['news', 'index'],
    queryFn: ({ signal }) => fetchIndex(signal),
    ...(LIVE_NEWS ? { staleTime: RECENT_MS, refetchInterval: RECENT_MS } : STATIC),
  });

export const newsMonthQuery = (month: string) =>
  queryOptions({
    queryKey: ['news', 'month', month],
    queryFn: ({ signal }) => fetchMonth(month, signal),
    ...freshness(isRecentMonth(month)),
  });

type NewsEvent = Pick<CalendarEventDto, 'code' | 'end'>;

export const tournamentNewsQuery = (t: NewsEvent) =>
  queryOptions({
    queryKey: ['news', 'tournament', t.code],
    queryFn: ({ signal }) => fetchTournament(t.code, signal),
    select: selectItems,
    ...freshness(isRecentEvent(t.end)),
  });

export const newsArticleQuery = (id: string) =>
  queryOptions({
    queryKey: ['news', 'article', id],
    queryFn: ({ signal }) => fetchArticle(id, signal),
    retry: retryUnless(NOT_FOUND),
    ...(LIVE_NEWS
      ? {
          staleTime: (q: { state: { data?: NewsArticle } }) =>
            q.state.data && isFrozenArticle(q.state.data) ? Infinity : RECENT_MS,
        }
      : STATIC),
  });

export const useNewsIndex = () => useQuery(newsIndexQuery());

export const useNewsArticle = (id: string) => useQuery(newsArticleQuery(id));

export const useNewsMonth = (month: string | undefined) =>
  useQuery({ ...newsMonthQuery(month ?? ''), enabled: !!month });

export const useTournamentNews = (t: NewsEvent) => useQuery(tournamentNewsQuery(t));

export interface NewsMonthState {
  page: NewsMonth | undefined;
  failed: boolean;
  settled: boolean;
}

const toMonthStates = (results: UseQueryResult<NewsMonth>[]): NewsMonthState[] =>
  results.map((r) => ({ page: r.data, failed: r.isError && !r.data, settled: !!r.data || r.isError }));

const IGNORE = () => null;

export const useNewsMonths = (months: readonly NewsMonthCount[], depth: number) => {
  const queries = useMemo(
    () => months.slice(0, depth).map((m) => ({ ...newsMonthQuery(m.month), enabled: false })),
    [months, depth],
  );
  return useQueries({ queries, combine: toMonthStates });
};

export const useFetchNewsMonths = (keys: readonly string[]) => {
  const queries = useMemo(() => keys.map((k) => newsMonthQuery(k)), [keys]);
  useQueries({ queries, combine: IGNORE });
};

const RELATED_COUNT = 4;

const others = (items: readonly NewsItem[] | undefined, id: string) =>
  (items ?? NO_ITEMS).filter((i) => i.id !== id).slice(0, RELATED_COUNT);

export interface RelatedNews {
  tournament: NewsItem[];
  latest: NewsItem[];
  isLoading: boolean;
}

export const useRelatedNews = (article: Pick<NewsArticle, 'id' | 'tournaments' | 'publishedAt'> | undefined) => {
  const code = article?.tournaments[0];
  const index = useNewsIndex();
  const tournament = useQuery({
    ...tournamentNewsQuery({ code: code ?? '', end: article?.publishedAt ?? '' }),
    enabled: !!code,
  });
  const id = article?.id ?? '';
  const tournamentItems = useMemo(() => others(tournament.data, id), [tournament.data, id]);
  const latest = useMemo(() => others(index.data?.latest, id), [index.data, id]);
  return useMemo(
    (): RelatedNews => ({
      tournament: tournamentItems,
      latest,
      isLoading: index.isLoading || (!!code && tournament.isLoading),
    }),
    [tournamentItems, latest, index.isLoading, code, tournament.isLoading],
  );
};
