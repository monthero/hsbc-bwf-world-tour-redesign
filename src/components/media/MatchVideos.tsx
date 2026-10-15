import type { FC } from 'react';

import { SectionTitle } from '~/components/ui';
import { useTournamentMedia } from '~/hooks/useTournamentMedia';
import type { Match, Tournament } from '~/types';
import { matchStream } from '~/utils/media';

import { VideoCard } from './VideoCard';

import classes from './MatchVideos.module.css';

export const MatchVideos: FC<{ match: Match; tournament: Tournament; className?: string }> = ({
  match,
  tournament,
  className,
}) => {
  const links = useTournamentMedia(tournament);
  const media = links.byMatch.get(match.id);
  const stream = match.status === 'P' ? matchStream(links.byMatch, links.courts, match) : undefined;
  if (!stream && !media?.full && !media?.highlights) return null;
  return (
    <section className={className}>
      <SectionTitle as="h3">Watch on YouTube</SectionTitle>
      <div className={classes.list}>
        {stream && <VideoCard item={stream} eventName={tournament.name} timeZone={tournament.timeZone} layout="row" />}
        {media?.highlights && (
          <VideoCard item={media.highlights} label="Highlights" eventName={tournament.name} layout="row" />
        )}
        {media?.full && <VideoCard item={media.full} label="Full match" eventName={tournament.name} layout="row" />}
      </div>
    </section>
  );
};
