import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Skeleton, VisuallyHidden } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { NewsArticle } from '~/api/schemas';
import { NewsImage, TournamentChip } from '~/components/news';
import { PlayerAvatar, PlayerName } from '~/components/player';
import { BackPill, Eyebrow, IconCamera, IconClock, Tip } from '~/components/ui';
import { formatDayMonthYear } from '~/utils/dates';
import type { NewsStory } from '~/utils/news';

import { BACK, BACK_LABEL, HERO_SIZES, HERO_WIDTHS, MAX_PLAYERS } from '../constants';
import type { FeaturedPlayer } from '../utils';
import { ShareBar } from './ShareBar';

import classes from './ArticleHeader.module.css';
import utils from '~/styles/utils.module.css';

const READ_TIME = msg({
  message: '{minutes, plural, one {# min read} other {# min read}}',
  comment: 'Estimated reading time of a news article, in minutes',
});

const ReadTime = memo<{ minutes: number }>(({ minutes }) => {
  const { i18n } = useLingui();
  const label = i18n._({ ...READ_TIME, values: { minutes } });
  return (
    <Tip label={label}>
      <span className={classes.readTime}>
        <IconClock />
        <span aria-hidden>{minutes}′</span>
        <VisuallyHidden>{label}</VisuallyHidden>
      </span>
    </Tip>
  );
});

const Byline = memo<{ article: NewsArticle; minutes: number }>(({ article, minutes }) => (
  <p className={classes.meta}>
    <span className={classes.byline}>{article.byline ?? 'BWF'}</span>
    <time dateTime={article.publishedAt}>{formatDayMonthYear(article.publishedAt)}</time>
    <ReadTime minutes={minutes} />
  </p>
));

const Players = memo<{ players: readonly FeaturedPlayer[] }>(({ players }) => {
  const [expanded, { open: expand }] = useDisclosure(false);
  const hidden = expanded ? 0 : Math.max(0, players.length - MAX_PLAYERS);
  return (
    <div className={clsx(utils.noScrollbar, classes.players)} data-expanded={expanded || undefined}>
      <Eyebrow>
        <Trans comment="Label before the avatars of players mentioned in a news article">Featuring</Trans>
      </Eyebrow>
      {players.slice(0, players.length - hidden).map(({ player, photo }) => (
        <span key={player.id} className={classes.player}>
          <PlayerAvatar player={player} photo={photo} size={28} link />
          <PlayerName player={player} />
        </span>
      ))}
      {hidden > 0 && (
        <button type="button" className={classes.more} onClick={expand}>
          <Trans comment="Button that reveals the remaining players mentioned in a news article">+{hidden} more</Trans>
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
  const { i18n } = useLingui();
  const credit = article?.photoCredit;
  return (
    <header className={classes.header}>
      <div className={classes.intro}>
        <div className={classes.top}>
          <span className={classes.kicker}>
            <BackPill link={BACK} label={i18n._(BACK_LABEL)} iconOnly />
            {story?.tournament && <TournamentChip tournament={story.tournament} />}
            {story?.kind && <Eyebrow className={classes.kind}>{story.kind}</Eyebrow>}
          </span>
          {article && <ShareBar title={article.title} />}
        </div>
        {story ? (
          <h1 className={clsx(classes.title, classes.measure)} lang="en" dir="auto">
            {story.title}
          </h1>
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
        {(article?.image?.caption || credit) && (
          <figcaption>
            {article?.image?.caption}
            {credit && (
              <span className={classes.credit}>
                <IconCamera />
                <Trans comment="Photo credit under a news article’s main image; the “Photo:” label is read by screen readers only">
                  <VisuallyHidden>Photo: </VisuallyHidden>
                  {credit}
                </Trans>
              </span>
            )}
          </figcaption>
        )}
      </figure>
    </header>
  );
});
