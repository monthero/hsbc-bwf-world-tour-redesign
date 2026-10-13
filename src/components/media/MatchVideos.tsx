import type { FC } from 'react';

import { useTournamentMedia } from '~/hooks/useTournamentMedia';
import type { Match, Tournament } from '~/types';
import { matchStream } from '~/utils/media';

import { VideoCard } from './VideoCard';

import classes from './MatchVideos.module.css';

export const MatchVideos: FC<{ match: Match; tournament: Tournament }> = ({ match, tournament }) => {
  const links = useTournamentMedia(tournament);
  const media = links.byMatch.get(match.id);
  const stream = match.status === 'P' ? matchStream(links.byMatch, links.courts, match) : undefined;
  if (!stream && !media?.full && !media?.highlights) return null;
  return (
    <section className={classes.root}>
      <h3 className={classes.title}>Watch on YouTube</h3>
      <div className={classes.grid}>
        {stream && (
          <VideoCard item={stream} label="Live stream" eventName={tournament.name} timeZone={tournament.timeZone} />
        )}
        {media?.highlights && <VideoCard item={media.highlights} label="Highlights" eventName={tournament.name} />}
        {media?.full && <VideoCard item={media.full} label="Full match" eventName={tournament.name} />}
      </div>
    </section>
  );
};
