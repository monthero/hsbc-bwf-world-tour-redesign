import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import type { MediaItem } from '~/api/schemas';
import { EventTag } from '~/components/match/EventTag';
import { LiveDot } from '~/components/ui';
import { useInstantTime } from '~/hooks/useMatchClock';
import { useMediaAvailable } from '~/hooks/useTournamentMedia';
import { DARK_SCOPE_PROPS } from '~/theme';
import type { Match } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { formatStamp, type ClockTime } from '~/utils/match-time';
import { matchRoundName } from '~/utils/matches';
import { compactTitle, durationLabel, thumbUrl, watchUrl } from '~/utils/media';

import { REGION_NOTE } from './labels';

import classes from './VideoCard.module.css';

const LIVE_LABELS = {
  live: msg({ message: 'Live', context: 'stream', comment: 'Badge on a YouTube stream that is broadcasting now' }),
  upcoming: msg({
    message: 'Upcoming',
    context: 'stream',
    comment: 'Badge on a scheduled YouTube stream that hasn’t started yet',
  }),
} as const;
const LIVE_DOT = <LiveDot pulse size={6} />;

const startOf = (item: MediaItem) => (item.live === 'upcoming' ? item.scheduledAt : null);

const metaOf = (i18n: I18n, item: MediaItem, match: Match | undefined, start: ClockTime | null) => {
  if (start) {
    const when = formatStamp(start);
    return i18n._(
      msg({
        message: `Starts ${when}`,
        comment: 'When a scheduled YouTube stream begins, e.g. “Starts Sat 14 Mar, 10:00 CET”',
      }),
    );
  }
  if (match) return matchRoundName(match);
  return formatDayMonth(item.publishedAt.slice(0, 10));
};

export const VideoCard = memo<{
  item: MediaItem;
  match?: Match;
  label?: string;
  eventName?: string;
  timeZone?: string | null;
  layout?: 'card' | 'row';
}>(({ item, match, label, eventName, timeZone = null, layout = 'card' }) => {
  const available = useMediaAvailable(item);
  const start = useInstantTime(startOf(item), timeZone);
  const title = useMemo(() => (eventName ? compactTitle(item.title, eventName) : item.title), [item.title, eventName]);
  const duration = durationLabel(item.durationSec);
  const { i18n } = useLingui();
  const body = (
    <>
      <span className={classes.thumb} {...DARK_SCOPE_PROPS}>
        <img src={thumbUrl(item.id)} alt="" loading="lazy" />
        {item.live !== 'none' && (
          <span className={classes.live} data-state={item.live}>
            {item.live === 'live' && LIVE_DOT}
            {i18n._(LIVE_LABELS[item.live])}
          </span>
        )}
        {duration && <span className={classes.duration}>{duration}</span>}
      </span>
      <span className={classes.body}>
        {label && <span className={classes.label}>{label}</span>}
        <span className={classes.title}>{title}</span>
        <span className={classes.meta}>
          {match && <EventTag event={match.event} />}
          {metaOf(i18n, item, match, start)}
        </span>
        {!available && <span className={classes.blocked}>{i18n._(REGION_NOTE)}</span>}
      </span>
    </>
  );
  if (!available)
    return (
      <div className={classes.card} title={item.title} data-layout={layout} data-disabled>
        {body}
      </div>
    );
  return (
    <a
      href={watchUrl(item.id)}
      target="_blank"
      rel="noreferrer"
      className={classes.card}
      title={item.title}
      data-layout={layout}
    >
      {body}
    </a>
  );
});
