import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type Ref } from 'react';

import type { MediaItem } from '~/api/schemas';
import { ShowdownCard, StakePill, toShowdownView, type ShowdownView } from '~/components/match';
import { WatchButton } from '~/components/media';
import { CardHit, Duration, StatusChip } from '~/components/ui';
import { useMatchStream } from '~/hooks/useTournamentMedia';
import type { Match, Tournament } from '~/types';
import { joinDots } from '~/utils/format';
import { courtLabel, detailsLabel, matchTitle } from '~/utils/matches';

import { LiveHeadToHead } from './LiveHeadToHead';
import { useLiveView } from './useLiveView';

import classes from './Showdown.module.css';
import utils from '~/styles/utils.module.css';

export const Showdown = memo<{
  view: ShowdownView;
  stream?: MediaItem;
  onOpen: (id: string) => void;
  className?: string;
  ref?: Ref<HTMLElement>;
}>(({ view: v, stream, onOpen, className, ref }) => {
  const m = v.match;
  const court = courtLabel(m.court);
  const open = useCallback(() => onOpen(m.id), [onOpen, m.id]);
  return (
    <ShowdownCard
      ref={ref}
      view={v}
      label={joinDots([v.live.event, v.live.round])}
      className={clsx(classes.card, className)}
    >
      <CardHit label={detailsLabel(matchTitle(m))} onClick={open} className={classes.hit} />
      <div className={classes.head}>
        <span className={classes.where}>
          {court && <span className={classes.court}>{court}</span>}
          <span className={utils.ellipsis}>{v.live.event}</span>
          <span aria-hidden>·</span>
          <span className={classes.round}>{v.live.round}</span>
        </span>
        <span className={classes.headEnd}>
          <Duration min={v.live.durationMin} className={utils.raise} />
          {stream && <WatchButton item={stream} />}
        </span>
      </div>
      {(v.status || v.stake) && (
        <div className={classes.lead}>
          {v.status && <StatusChip tone={v.status.tone}>{v.status.label}</StatusChip>}
          {v.stake && <StakePill stake={v.stake} />}
        </div>
      )}
    </ShowdownCard>
  );
});

export const MatchShowdown = memo<{
  match: Match;
  tournament: Tournament;
  replay?: MediaItem;
  h2h?: boolean;
  onOpen: (id: string) => void;
}>(({ match: m, tournament, replay, h2h, onOpen }) => {
  const [ref, live] = useLiveView<HTMLElement>(tournament, m);
  const view = useMemo(() => toShowdownView(m, live), [m, live]);
  const stream = useMatchStream(tournament, m);
  return (
    <>
      <Showdown ref={ref} view={view} stream={replay ?? stream} onOpen={onOpen} />
      {h2h && (
        <div className={utils.container}>
          <LiveHeadToHead match={m} tournament={tournament} />
        </div>
      )}
    </>
  );
});
