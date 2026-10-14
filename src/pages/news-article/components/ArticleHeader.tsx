import { Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { NewsArticle } from '~/api/schemas';
import { NewsImage, TournamentChip } from '~/components/news';
import { PlayerAvatar, PlayerName } from '~/components/player';
import { BackPill, Eyebrow } from '~/components/ui';
import { formatDayMonthYear } from '~/utils/dates';
import type { NewsStory } from '~/utils/news';

import { HERO_SIZES, HERO_WIDTHS } from '../constants';
import { MAX_PLAYERS } from '../constants';
import type { FeaturedPlayer } from '../utils';
import { ShareBar } from './ShareBar';

import classes from './ArticleHeader.module.css';
import utils from '~/styles/utils.module.css';

const BACK = { to: '/news' } as const;

const Byline = memo<{ article: NewsArticle; minutes: number }>(({ article, minutes }) => (
  <p className={classes.meta}>
    <span className={classes.byline}>{article.byline ?? 'BWF'}</span>
    <time dateTime={article.publishedAt}>{formatDayMonthYear(article.publishedAt)}</time>
    <span>{`${minutes} min read`}</span>
  </p>
));

const Players = memo<{ players: readonly FeaturedPlayer[] }>(({ players }) => {
  const [expanded, { open: expand }] = useDisclosure(false);
  const hidden = expanded ? 0 : Math.max(0, players.length - MAX_PLAYERS);
  return (
    <div className={clsx(utils.noScrollbar, classes.players)} data-expanded={expanded || undefined}>
      <Eyebrow>Featuring</Eyebrow>
      {players.slice(0, players.length - hidden).map(({ player, photo }) => (
        <span key={player.id} className={classes.player}>
          <PlayerAvatar player={player} photo={photo} size={28} link />
          <PlayerName player={player} />
        </span>
      ))}
      {hidden > 0 && (
        <button type="button" className={classes.more} onClick={expand}>
          +{hidden} more
        </button>
      )}
    </div>
  );
});

export const ArticleHeader = memo<{
  article: NewsArticle | undefined;
  story: NewsStory | undefined;
  minutes: number;
  players: readonly FeaturedPlayer[];
}>(({ article, story, minutes, players }) => {
  return (
    <header className={classes.header}>
      <div className={classes.intro}>
        <div className={classes.top}>
          <span className={classes.kicker}>
            <BackPill link={BACK}>News</BackPill>
            {story?.tournament && <TournamentChip tournament={story.tournament} />}
            {story?.kind && <Eyebrow className={classes.kind}>{story.kind}</Eyebrow>}
          </span>
          {article && <ShareBar title={article.title} />}
        </div>
        {story ? (
          <h1 className={clsx(classes.title, classes.measure)}>{story.title}</h1>
        ) : (
          <>
            <Skeleton height={40} radius={8} className={classes.measure} />
            <Skeleton height={40} width="65%" radius={8} className={classes.measure} />
          </>
        )}
        <div className={classes.details}>
          {article ? <Byline article={article} minutes={minutes} /> : <Skeleton height={14} width={260} radius={6} />}
          {players.length > 0 && <Players players={players} />}
        </div>
      </div>
      <figure className={classes.hero}>
        {article ? (
          <NewsImage
            image={article.image}
            ratio="wide"
            widths={HERO_WIDTHS}
            sizes={HERO_SIZES}
            eager
            className={classes.heroImage}
          />
        ) : (
          <Skeleton className={classes.heroImage} radius={0} />
        )}
        {(article?.image?.caption || article?.photoCredit) && (
          <figcaption>
            {article.image?.caption}
            {article.photoCredit && <span className={classes.credit}>{`Photo: ${article.photoCredit}`}</span>}
          </figcaption>
        )}
      </figure>
    </header>
  );
});
