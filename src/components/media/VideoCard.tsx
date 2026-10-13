import { memo, useMemo, type ReactNode } from 'react';

import type { MediaItem } from '~/api/schemas';
import { EventTag } from '~/components/match/EventTag';
import { LiveDot } from '~/components/ui';
import { useMediaAvailable } from '~/hooks/useTournamentMedia';
import type { Match } from '~/types';
import { formatDayMonth, formatLocalDayTime } from '~/utils/dates';
import { matchRoundName } from '~/utils/matches';
import { compactTitle, durationLabel, thumbUrl, watchUrl } from '~/utils/media';

import classes from './VideoCard.module.css';

const LIVE_LABELS = { live: 'Live', upcoming: 'Upcoming' } as const;
const LIVE_DOT = <LiveDot pulse size={6} />;
export const REGION_NOTE = 'Not available in your region';

const metaOf = (item: MediaItem, match: Match | undefined): ReactNode => {
  if (item.live === 'upcoming' && item.scheduledAt) return `Starts ${formatLocalDayTime(item.scheduledAt)}`;
  if (match) return matchRoundName(match);
  return formatDayMonth(item.publishedAt.slice(0, 10));
};

export const VideoCard = memo<{ item: MediaItem; match?: Match; label?: string; eventName?: string }>(
  ({ item, match, label, eventName }) => {
    const available = useMediaAvailable(item);
    const title = useMemo(
      () => (eventName ? compactTitle(item.title, eventName) : item.title),
      [item.title, eventName],
    );
    const duration = durationLabel(item.durationSec);
    const body = (
      <>
        <span className={classes.thumb}>
          <img src={thumbUrl(item.id)} alt="" loading="lazy" />
          {item.live !== 'none' && (
            <span className={classes.live} data-state={item.live}>
              {item.live === 'live' && LIVE_DOT}
              {LIVE_LABELS[item.live]}
            </span>
          )}
          {duration && <span className={classes.duration}>{duration}</span>}
        </span>
        <span className={classes.body}>
          {label && <span className={classes.label}>{label}</span>}
          <span className={classes.title}>{title}</span>
          <span className={classes.meta}>
            {match && <EventTag event={match.event} />}
            {metaOf(item, match)}
          </span>
          {!available && <span className={classes.blocked}>{REGION_NOTE}</span>}
        </span>
      </>
    );
    if (!available)
      return (
        <div className={classes.card} title={item.title} data-disabled>
          {body}
        </div>
      );
    return (
      <a href={watchUrl(item.id)} target="_blank" rel="noreferrer" className={classes.card} title={item.title}>
        {body}
      </a>
    );
  },
);
