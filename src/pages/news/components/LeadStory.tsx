import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { NewsImage, NewsMeta, NewsTitle, SkeletonLines, TournamentChip } from '~/components/news';
import { IconArrowRight } from '~/components/ui';
import type { NewsStory } from '~/utils/news';

import classes from './LeadStory.module.css';
import utils from '~/styles/utils.module.css';

const WIDTHS = [480, 720, 960, 1280] as const;
const SIZES = '(max-width: 48em) 100vw, 60vw';

export const LeadStory = memo<{ story: NewsStory | undefined; isMobile: boolean }>(({ story, isMobile }) => {
  if (!story)
    return (
      <div className={clsx(utils.card, classes.lead)} aria-hidden>
        <Skeleton className={classes.ghost} radius={0} />
        {isMobile && <SkeletonLines className={classes.body} />}
      </div>
    );
  return (
    <article className={clsx(utils.card, classes.lead)} data-interactive data-news-hover="drift">
      <NewsImage image={story.item.image} ratio="wide" widths={WIDTHS} sizes={SIZES} eager className={classes.media} />
      {story.tournament && <TournamentChip tournament={story.tournament} variant="glass" className={classes.tag} />}
      <div className={classes.body}>
        <NewsTitle story={story} as="h3" className={classes.title} />
        {story.item.excerpt && <p className={classes.excerpt}>{story.item.excerpt}</p>}
        <span className={classes.foot}>
          <NewsMeta story={story} />
          <IconArrowRight className={classes.read} />
        </span>
      </div>
    </article>
  );
});
