import { memo } from 'react';

import type { MediaItem } from '~/api/schemas';
import { EventTag } from '~/components/match/EventTag';
import type { Match } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { matchRoundName } from '~/utils/matches';
import { durationLabel, thumbUrl, watchUrl } from '~/utils/media';

import classes from './VideoCard.module.css';

const LIVE_LABELS = { live: 'Live', upcoming: 'Upcoming' } as const;

export const VideoCard = memo<{ item: MediaItem; match?: Match; label?: string }>(({ item, match, label }) => {
  const duration = durationLabel(item.durationSec);
  return (
    <a href={watchUrl(item.id)} target="_blank" rel="noreferrer" className={classes.card}>
      <span className={classes.thumb}>
        <img src={thumbUrl(item.id)} alt="" loading="lazy" />
        {item.live !== 'none' && (
          <span className={classes.live} data-state={item.live}>
            {LIVE_LABELS[item.live]}
          </span>
        )}
        {duration && <span className={classes.duration}>{duration}</span>}
      </span>
      <span className={classes.body}>
        {label && <span className={classes.label}>{label}</span>}
        <span className={classes.title}>{item.title}</span>
        <span className={classes.meta}>
          {match && <EventTag event={match.event} />}
          {match ? matchRoundName(match) : formatDayMonth(item.publishedAt.slice(0, 10))}
        </span>
      </span>
    </a>
  );
});
