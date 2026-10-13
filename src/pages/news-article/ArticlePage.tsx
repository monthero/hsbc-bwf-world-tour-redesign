import { Button, Skeleton } from '@mantine/core'
import { getRouteApi, Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { useCallback, useMemo, type FC } from 'react'

import { ApiError } from '~/api/client'
import { useNewsArticle, useNewsIndex, useRelatedNews } from '~/api/news'
import type { NewsArticle, NewsItem } from '~/api/schemas'
import { PopularNews, SubscribeCard } from '~/components/news'
import { BackPill, EmptyState, IconExternal } from '~/components/ui'
import { NOT_FOUND } from '~/constants'
import { useDocumentTitle } from '~/hooks/useDocumentTitle'
import { useIsMobile } from '~/hooks/useIsMobile'
import { useTournamentLookup } from '~/hooks/useNews'
import { usePlayerDirectory } from '~/hooks/usePlayers'
import { toStory, type TournamentLookup } from '~/utils/news'

import { ArticleHeader } from './components/ArticleHeader'
import { Block } from './components/blocks/Blocks'
import { RelatedSection } from './components/RelatedSection'
import { OFFICIAL_HOST } from './constants'
import { LookupContext } from './context'
import { featuredPlayers, readMinutes } from './utils'

import classes from './ArticlePage.module.css'
import utils from '~/styles/utils.module.css'

const route = getRouteApi('/news_/$id')

const BACK = { to: '/news' } as const
const TITLE_SITE = {}
const BODY_SKELETON = ['100%', '94%', '97%', '62%', '100%', '91%', '78%'] as const

const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404

const storiesOf = (items: readonly NewsItem[], lookup: TournamentLookup | undefined) =>
  items.map((i) => toStory(i, lookup))

export const ArticlePage: FC = () => {
  const { id } = route.useParams()
  const { data: article, error, isError, refetch } = useNewsArticle(id)
  const missing = isNotFound(error)
  useDocumentTitle(missing ? NOT_FOUND : [article?.title, 'News'], TITLE_SITE)
  const retry = useCallback(() => void refetch(), [refetch])

  if (isError && !article)
    return (
      <div className={clsx(utils.container, classes.state)}>
        <BackPill link={BACK}>News</BackPill>
        <EmptyState className={classes.empty}>
          <p>{missing ? 'We couldn’t find this story.' : 'Couldn’t load this story.'}</p>
          {missing ? (
            <Button component={Link} to="/news" variant="default" radius="xl">
              Browse all news
            </Button>
          ) : (
            <Button variant="default" radius="xl" onClick={retry}>
              Try again
            </Button>
          )}
        </EmptyState>
      </div>
    )

  return <Article key={id} article={article} />
}

const Article: FC<{ article: NewsArticle | undefined }> = ({ article }) => {
  const isMobile = useIsMobile()
  const lookup = useTournamentLookup()
  const { data: directory } = usePlayerDirectory()
  const { data: index } = useNewsIndex()
  const related = useRelatedNews(article)

  const story = useMemo(() => article && toStory(article, lookup), [article, lookup])
  const minutes = useMemo(() => (article ? readMinutes(article.blocks) : 0), [article])
  const players = useMemo(
    () => featuredPlayers(article ? [...article.players, ...article.matchedPlayers] : [], directory),
    [article, directory],
  )
  const popular = useMemo(() => index?.popular.map((i) => toStory(i, lookup)), [index, lookup])
  const more = useMemo(() => storiesOf(related.tournament, lookup), [related.tournament, lookup])
  const latest = useMemo(() => storiesOf(related.latest, lookup), [related.latest, lookup])
  const loadingRelated = related.isLoading

  return (
    <LookupContext value={lookup}>
      <div className={utils.container}>
        <ArticleHeader article={article} story={story} minutes={minutes} players={players} />
        <div className={classes.layout}>
          <article className={classes.body}>
            {article ? (
              article.blocks.map((b, i) => <Block key={i} block={b} />)
            ) : (
              <span className={classes.bodySkeleton} aria-hidden>
                {BODY_SKELETON.map((w, i) => (
                  <Skeleton key={i} height={16} width={w} radius={6} />
                ))}
              </span>
            )}
            {article && (
              <footer className={classes.footer}>
                {article.tags.length > 0 && (
                  <ul className={classes.tags}>
                    {article.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                <a href={article.url} target="_blank" rel="noreferrer" className={classes.source}>
                  {`Read on ${OFFICIAL_HOST}`}
                  <IconExternal />
                </a>
              </footer>
            )}
          </article>
          <aside className={classes.aside}>
            {(!index || !!popular?.length) && <PopularNews stories={popular} layout="list" />}
            <SubscribeCard compact />
          </aside>
        </div>
        {story?.tournament && (loadingRelated || more.length > 0) && (
          <RelatedSection
            title={`More from ${story.tournament.name}`}
            stories={loadingRelated ? undefined : more}
            isMobile={isMobile}
          />
        )}
        {(loadingRelated || latest.length > 0) && (
          <RelatedSection title="Latest news" stories={loadingRelated ? undefined : latest} isMobile={isMobile} />
        )}
      </div>
    </LookupContext>
  )
}
