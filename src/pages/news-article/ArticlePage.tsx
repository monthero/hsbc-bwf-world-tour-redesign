import { Skeleton } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useMemo, type FC } from 'react';

import { isNotFound, useNewsArticle, useNewsIndex, useRelatedNews } from '~/api/news';
import type { NewsArticle } from '~/api/schemas';
import { NotFound, type NotFoundAction } from '~/components/layout';
import { PopularNews, SubscribeCard } from '~/components/news';
import { BackPill, IconExternal, RetryState } from '~/components/ui';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useTournamentLookup } from '~/hooks/useNews';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import { articleMeta, ERROR_META, NOT_FOUND_META } from '~/utils/meta';
import { toStories, toStory } from '~/utils/news';

import { ArticleHeader } from './components/ArticleHeader';
import { Block } from './components/blocks/Blocks';
import { RelatedSection } from './components/RelatedSection';
import { BACK, BACK_LABEL, OFFICIAL_HOST } from './constants';
import { LookupContext } from './context';
import { featuredPlayers, readMinutes } from './utils';

import classes from './ArticlePage.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/news_/$id');

const MISSING_TITLE = 'We couldn’t find that story';
const MISSING_DESCRIPTION = 'It may have been taken down from the BWF newsroom, or the link is out of date.';
const MISSING_ACTION: NotFoundAction = { label: BACK_LABEL, link: BACK };
const BODY_SKELETON = ['100%', '94%', '97%', '62%', '100%', '91%', '78%'] as const;

export const ArticlePage: FC = () => {
  const { id } = route.useParams();
  const { data: article, error, isError, refetch } = useNewsArticle(id);
  const missing = isNotFound(error);
  const failed = isError && !article;
  const meta = useMemo(() => {
    if (missing) return NOT_FOUND_META;
    if (failed) return ERROR_META;
    return article && articleMeta(article);
  }, [missing, failed, article]);
  useDocumentMeta(meta);
  const retry = useCallback(() => void refetch(), [refetch]);

  if (missing) return <NotFound title={MISSING_TITLE} description={MISSING_DESCRIPTION} action={MISSING_ACTION} />;

  if (failed)
    return (
      <div className={clsx(utils.container, classes.state)}>
        <BackPill link={BACK} label={BACK_LABEL} iconOnly />
        <RetryState message="Couldn’t load this story." onRetry={retry} className={classes.empty} />
      </div>
    );

  return <Article key={id} article={article} />;
};

const Article: FC<{ article: NewsArticle | undefined }> = ({ article }) => {
  const isMobile = useIsMobile();
  const lookup = useTournamentLookup();
  const { data: directory } = usePlayerDirectory();
  const { data: index } = useNewsIndex();
  const related = useRelatedNews(article);

  const story = useMemo(() => article && toStory(article, lookup), [article, lookup]);
  const minutes = useMemo(() => (article ? readMinutes(article.blocks) : 0), [article]);
  const players = useMemo(
    () => featuredPlayers(article ? [...article.players, ...article.matchedPlayers] : [], directory),
    [article, directory],
  );
  const popular = useMemo(() => index && toStories(index.popular, lookup), [index, lookup]);
  const more = useMemo(() => toStories(related.tournament, lookup), [related.tournament, lookup]);
  const latest = useMemo(() => toStories(related.latest, lookup), [related.latest, lookup]);
  const loadingRelated = related.isLoading;

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
  );
};
