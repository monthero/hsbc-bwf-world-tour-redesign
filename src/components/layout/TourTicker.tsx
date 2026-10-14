import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo } from 'react';

import { LevelBadge, TournamentPlace, TournamentStatusBadge } from '~/components/tournament';
import { IconNext, LiveDot } from '~/components/ui';
import { useLiveAndNext } from '~/hooks/useTournaments';
import { tournamentParams } from '~/utils/tournaments';

import classes from './TourTicker.module.css';
import utils from '~/styles/utils.module.css';

export const TourTicker = memo(() => {
  const { live, next } = useLiveAndNext();
  const t = live ?? next;
  if (!t) return null;
  return (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      className={classes.ticker}
      data-live={live ? true : undefined}
    >
      <span className={clsx(utils.container, classes.inner)}>
        <span className={classes.kind}>
          {live && <LiveDot pulse size={6} />}
          {live ? 'Live' : 'Next'}
        </span>
        <LevelBadge level={t.level} size="sm" />
        <span className={clsx(utils.ellipsis, classes.title)}>{t.heading}</span>
        <TournamentPlace tournament={t} cityOnly className={classes.place} />
        <TournamentStatusBadge tournament={t} variant="line" short className={classes.status} />
        <IconNext className={classes.arrow} />
      </span>
    </Link>
  );
});
