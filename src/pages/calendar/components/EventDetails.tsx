import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import {
  LevelBadge,
  LogoTile,
  PodiumLink,
  TournamentPlace,
  TournamentStatusBadge,
  WinnersList,
} from '~/components/tournament';
import { IconNext } from '~/components/ui';
import type { Tournament } from '~/types';
import { hasWinners, tournamentParams } from '~/utils/tournaments';

import classes from './EventDetails.module.css';
import utils from '~/styles/utils.module.css';

export const EventDetails = memo<{ tournament: Tournament }>(({ tournament: t }) => {
  return (
    <>
      <div className={classes.top}>
        <span className={utils.num}>{t.dates}</span>
        <LevelBadge level={t.level} size="sm" />
      </div>
      <div className={classes.identity}>
        <LogoTile src={t.logo} name={t.name} size={52} flat />
        <div className={classes.info}>
          <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={classes.title}>
            {t.title}
          </Link>
          <div className={classes.meta}>
            <TournamentPlace tournament={t} />
            <span className={classes.sep}>·</span>
            <span className={utils.num}>{t.prizeLabel}</span>
          </div>
        </div>
      </div>
      {hasWinners(t) && (
        <>
          <WinnersList champions={t.champions} bordered />
          <PodiumLink tournament={t} />
        </>
      )}
      {t.status !== 'done' && <TournamentStatusBadge tournament={t} variant="line" className={classes.status} />}
      <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={classes.go}>
        Go to tournament
        <IconNext size={14} />
      </Link>
    </>
  );
});
