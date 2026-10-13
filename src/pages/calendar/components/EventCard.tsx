import { memo, useMemo } from 'react';

import { FollowButton } from '~/components/follow';
import { TournamentCard, WinnersHoverCard } from '~/components/tournament';
import type { Tournament } from '~/types';

import type { AnchorRef } from '../types';

import classes from './EventCard.module.css';

export const EventCard = memo<{
  tournament: Tournament;
  isNext: boolean;
  anchorRef?: AnchorRef;
}>(({ tournament: t, isNext, anchorRef }) => {
  const meta = useMemo(() => ({ name: t.name, slug: t.slug, year: t.year }), [t.name, t.slug, t.year]);
  return (
    <WinnersHoverCard tournament={t} position="right-start">
      <div ref={anchorRef} className={classes.wrap}>
        <TournamentCard tournament={t} isNext={isNext} link />
        <FollowButton
          kind="tournament"
          id={t.code}
          meta={meta}
          name={t.name}
          variant="glass"
          iconSize={15}
          className={classes.star}
        />
      </div>
    </WinnersHoverCard>
  );
});
