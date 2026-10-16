import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import type { FC } from 'react';

import { SectionTitle } from '~/components/ui';
import { useTournamentMedia } from '~/hooks/useTournamentMedia';
import type { Match, Tournament } from '~/types';
import { matchStream, replayStream } from '~/utils/media';

import { WATCH_ON_YOUTUBE } from './labels';
import { VideoCard } from './VideoCard';

import classes from './MatchVideos.module.css';

const REPLAY_LABEL = msg({
  message: 'Stream replay',
  comment: 'Label on a recording of the court’s live stream, cued to this match',
});
const HIGHLIGHTS_LABEL = msg({
  message: 'Highlights',
  comment: 'Label on a short YouTube highlights video of the match',
});
const FULL_LABEL = msg({ message: 'Full match', comment: 'Label on a YouTube video of the entire match' });

const streamOf = (links: ReturnType<typeof useTournamentMedia>, match: Match) => {
  if (match.status === 'P') return matchStream(links.byMatch, links.courts, match);
  if (match.status === 'F') return replayStream(links.byMatch.get(match.id), links.courtVods.get(match.id));
  return undefined;
};

export const MatchVideos: FC<{ match: Match; tournament: Tournament; className?: string }> = ({
  match,
  tournament,
  className,
}) => {
  const links = useTournamentMedia(tournament);
  const media = links.byMatch.get(match.id);
  const stream = streamOf(links, match);
  const { i18n } = useLingui();
  if (!stream && !media?.full && !media?.highlights) return null;
  return (
    <section className={className}>
      <SectionTitle as="h3">{i18n._(WATCH_ON_YOUTUBE)}</SectionTitle>
      <div className={classes.list}>
        {stream && (
          <VideoCard
            item={stream}
            label={stream.live === 'none' ? i18n._(REPLAY_LABEL) : undefined}
            eventName={tournament.name}
            timeZone={tournament.timeZone}
            layout="row"
          />
        )}
        {media?.highlights && (
          <VideoCard
            item={media.highlights}
            label={i18n._(HIGHLIGHTS_LABEL)}
            eventName={tournament.name}
            layout="row"
          />
        )}
        {media?.full && (
          <VideoCard item={media.full} label={i18n._(FULL_LABEL)} eventName={tournament.name} layout="row" />
        )}
      </div>
    </section>
  );
};
