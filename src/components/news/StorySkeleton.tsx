import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { NewsCardVariant } from './NewsCard';

import classes from './StorySkeleton.module.css';
import utils from '~/styles/utils.module.css';

export const SkeletonLines = memo<{ short?: string; className?: string }>(({ short = '60%', className }) => (
  <span className={clsx(classes.lines, className)}>
    <Skeleton height={14} radius={6} />
    <Skeleton height={14} width={short} radius={6} />
    <Skeleton height={11} width="35%" radius={6} mt={4} />
  </span>
));

export const StorySkeleton = memo<{ variant: NewsCardVariant }>(({ variant }) => {
  if (variant === 'card')
    return (
      <div className={clsx(utils.card, classes.card)} aria-hidden>
        <Skeleton className={classes.cover} radius={0} />
        <SkeletonLines className={classes.body} />
      </div>
    );
  return (
    <div className={classes.row} data-variant={variant} aria-hidden>
      <SkeletonLines short="70%" />
      <Skeleton className={classes.thumb} radius={variant === 'list' ? 10 : 12} />
    </div>
  );
});
