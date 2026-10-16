import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { BriefStory } from '~/utils/news';

import classes from './NewsTitle.module.css';

export const NewsTitle = memo<{ story: BriefStory; as?: 'h2' | 'h3'; className?: string }>(
  ({ story, as: Tag = 'h3', className }) => {
    return (
      <>
        {story.kind && (
          <span className={classes.kind} lang="en" dir="auto">
            {story.kind}
          </span>
        )}
        <Tag className={clsx(classes.title, className)} lang="en" dir="auto">
          <Link to="/news/$id" params={{ id: story.item.id }} className={classes.link} title={story.item.title}>
            {story.title}
          </Link>
        </Tag>
      </>
    );
  },
);
