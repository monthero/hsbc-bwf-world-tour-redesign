import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo } from 'react';

import { LevelBadge, LogoTile, TournamentPlace, TournamentStatusBadge } from '~/components/tournament';
import { IconNext, MediaCover } from '~/components/ui';
import { LEVEL_META, LEVEL_VARS } from '~/constants';
import type { Tournament } from '~/types';
import { countdownLabel, tournamentParams } from '~/utils/tournaments';

import type { AnchorRef } from '../types';

import classes from './EventRow.module.css';
import utils from '~/styles/utils.module.css';

export const EventRow = memo<{
  tournament: Tournament;
  isNext: boolean;
  anchorRef?: AnchorRef;
}>(({ tournament: t, isNext, anchorRef }) => {
  return (
    <Link
      ref={anchorRef}
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      className={clsx(utils.card, classes.row)}
      data-status={t.status}
    >
      <LogoTile className={classes.logo} src={t.logo} name={t.name} size={40} flat />
      <div className={classes.info}>
        <span className={classes.dates}>{t.dates}</span>
        <span className={classes.title}>{t.title}</span>
        <TournamentPlace tournament={t} className={classes.place} />
      </div>
      <div className={classes.side}>
        <LevelBadge level={t.level} size="sm" />
        <span className={classes.go}>
          {t.status === 'cancelled' && <TournamentStatusBadge tournament={t} variant="tag" />}
          {t.status === 'up' && (
            <span className={classes.countdown} data-next={isNext || undefined}>
              {countdownLabel(t, 'short')}
            </span>
          )}
          <IconNext size={16} />
        </span>
      </div>
    </Link>
  );
});

export const LiveCard = memo<{
  tournament: Tournament;
  anchorRef?: AnchorRef;
}>(({ tournament: t, anchorRef }) => {
  return (
    <Link
      ref={anchorRef}
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      className={clsx(utils.live, classes.live)}
      style={LEVEL_VARS[t.level]}
    >
      <MediaCover src={t.headerSquare} fade="strong" className={classes.liveMedia} />
      <LogoTile className={classes.liveLogo} src={t.logo} name={t.name} size={56} />
      <div className={classes.liveHead}>
        <TournamentStatusBadge tournament={t} variant="line" />
        <span className={classes.liveDates}>{t.dates}</span>
      </div>
      <div className={classes.liveTitle}>{t.title}</div>
      <div className={classes.liveMeta}>
        <TournamentPlace tournament={t} />
        <span>·</span>
        <span className={classes.liveLevel}>{LEVEL_META[t.level].label}</span>
        <span>·</span>
        <span className={utils.num}>{t.prizeLabel}</span>
      </div>
    </Link>
  );
});
