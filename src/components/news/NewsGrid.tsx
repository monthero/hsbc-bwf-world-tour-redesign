import { memo } from 'react';

import type { BriefStory } from '~/utils/news';

import { NewsCard } from './NewsCard';
import { StorySkeleton } from './StorySkeleton';

import classes from './NewsGrid.module.css';

export const NewsGrid = memo<{
  stories: readonly BriefStory[] | undefined;
  variant: 'card' | 'row';
  skeletons?: number;
}>(({ stories, variant, skeletons = 0 }) => (
  <div className={classes.grid}>
    {stories
      ? stories.map((s) => <NewsCard key={s.item.id} story={s} variant={variant} className={classes.item} />)
      : Array.from({ length: skeletons }, (_, i) => <StorySkeleton key={i} variant={variant} />)}
  </div>
));
