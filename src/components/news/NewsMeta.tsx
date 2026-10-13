import { clsx } from 'clsx';
import { memo } from 'react';

import type { NewsStory } from '~/utils/news';

import { TournamentChip } from './TournamentChip';

import classes from './NewsMeta.module.css';

export const NewsMeta = memo<{ story: NewsStory; chip?: boolean; className?: string }>(({ story, chip, className }) => {
  return (
    <span className={clsx(classes.meta, className)}>
      {chip && story.tournament && <TournamentChip tournament={story.tournament} />}
      {story.fresh && <span className={classes.fresh}>New</span>}
      <time dateTime={story.item.publishedAt}>{story.when}</time>
    </span>
  );
});
