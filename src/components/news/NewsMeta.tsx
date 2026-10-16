import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { BriefStory } from '~/utils/news';

import { TournamentChip } from './TournamentChip';

import classes from './NewsMeta.module.css';

export const NewsMeta = memo<{ story: BriefStory; chip?: boolean; className?: string }>(
  ({ story, chip, className }) => {
    return (
      <span className={clsx(classes.meta, className)}>
        {chip && story.tournament && <TournamentChip tournament={story.tournament} />}
        {story.fresh && (
          <span className={classes.fresh}>
            <Trans comment="Badge on a news story published in the last 24 hours">New</Trans>
          </span>
        )}
        <time dateTime={story.item.publishedAt}>{story.when}</time>
      </span>
    );
  },
);
