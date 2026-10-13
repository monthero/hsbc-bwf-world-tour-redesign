import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type Ref } from 'react';

import { IconFire, SectionTitle } from '~/components/ui';
import type { NewsStory } from '~/utils/news';

import { NewsImage } from './NewsImage';
import { NewsMeta } from './NewsMeta';
import { NewsTitle } from './NewsTitle';
import { SkeletonLines } from './StorySkeleton';

import classes from './PopularNews.module.css';
import utils from '~/styles/utils.module.css';

const SLOTS = Array.from({ length: 5 }, (_, i) => i);
const THUMB_WIDTHS = [144, 216] as const;
const THUMB_SIZES = '72px';

const PopularItem = memo<{ story: NewsStory }>(({ story }) => (
  <li className={classes.item} data-news-hover="shade">
    <NewsImage
      image={story.item.image}
      ratio="card"
      widths={THUMB_WIDTHS}
      sizes={THUMB_SIZES}
      className={classes.thumb}
    />
    <span className={classes.text}>
      <NewsTitle story={story} className={classes.title} />
      <NewsMeta story={story} chip />
    </span>
  </li>
));

const ItemSkeleton = memo(() => (
  <li className={classes.item} aria-hidden>
    <Skeleton className={classes.thumb} radius={8} />
    <SkeletonLines short="75%" />
  </li>
));

export const PopularNews = memo<{
  stories: readonly NewsStory[] | undefined;
  layout?: 'strip' | 'list';
  ref?: Ref<HTMLElement>;
  className?: string;
}>(({ stories, layout = 'strip', ref, className }) => {
  return (
    <section ref={ref} className={clsx(classes.section, className)} data-layout={layout}>
      <SectionTitle icon={<IconFire className={classes.fire} />}>Most popular</SectionTitle>
      <ol className={clsx(utils.noScrollbar, classes.strip)}>
        {stories
          ? stories.map((s) => <PopularItem key={s.item.id} story={s} />)
          : SLOTS.map((i) => <ItemSkeleton key={i} />)}
      </ol>
    </section>
  );
});
