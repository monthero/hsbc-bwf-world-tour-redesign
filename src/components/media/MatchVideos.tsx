import type { FC } from 'react';

import { SectionTitle } from '~/components/ui';
import { useTournamentMedia } from '~/hooks/useTournamentMedia';
import type { Match, Tournament } from '~/types';
import { matchStream, replayStream } from '~/utils/media';

import { VideoCard } from './VideoCard';

import classes from './MatchVideos.module.css';

const REPLAY_LABEL = 'Stream replay';

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
  if (!stream && !media?.full && !media?.highlights) return null;
  return (
    <section className={className}>
      <SectionTitle as="h3">Watch on YouTube</SectionTitle>
      <div className={classes.list}>
        {stream && (
          <VideoCard
            item={stream}
            label={stream.live === 'none' ? REPLAY_LABEL : undefined}
            eventName={tournament.name}
            timeZone={tournament.timeZone}
            layout="row"
          />
        )}
        {media?.highlights && (
          <VideoCard item={media.highlights} label="Highlights" eventName={tournament.name} layout="row" />
        )}
        {media?.full && <VideoCard item={media.full} label="Full match" eventName={tournament.name} layout="row" />}
      </div>
    </section>
  );
};
