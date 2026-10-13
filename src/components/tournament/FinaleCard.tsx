import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type FC, type RefCallback } from 'react';

import { MediaCover } from '~/components/ui';
import type { Tournament } from '~/types';
import { finalsCountdown } from '~/utils/season';
import { tournamentParams } from '~/utils/tournaments';

import { LogoTile } from './LogoTile';
import { TournamentPlace } from './TournamentStatus';

import classes from './FinaleCard.module.css';
import utils from '~/styles/utils.module.css';

const FINALS_TAGLINE = 'Final stop · Top 8 per discipline';

const Countdown: FC<{ tournament: Tournament; className?: string }> = ({ tournament, className }) => {
  const cd = finalsCountdown(tournament);
  return (
    <span className={className}>
      <span className={classes.days}>{cd.value}</span>
      <span className={classes.daysLabel}>{cd.label}</span>
    </span>
  );
};

interface CardProps {
  tournament: Tournament;
  anchorRef?: RefCallback<HTMLElement>;
  className?: string;
}

const WideCard: FC<CardProps> = ({ tournament: t, anchorRef, className }) => (
  <Link
    ref={anchorRef}
    to="/world-tour/$year/$slug"
    params={tournamentParams(t)}
    className={clsx(classes.card, className)}
  >
    <MediaCover src={t.header} fade="none" className={classes.cover} />
    <div className={classes.content}>
      <div className={classes.identity}>
        <LogoTile src={t.logo} name={t.name} size={60} />
        <span className={classes.tagline}>{FINALS_TAGLINE}</span>
        <span className={classes.title}>{t.title}</span>
        <span className={classes.meta}>
          <TournamentPlace tournament={t} flagSize="md" />
          <span className={classes.sep}>·</span>
          <span className={utils.num}>{t.dates}</span>
          <span className={classes.sep}>·</span>
          <span className={utils.num}>{t.prizeLabel}</span>
        </span>
      </div>
      <Countdown tournament={t} className={classes.countdown} />
    </div>
  </Link>
);

const CompactCard: FC<CardProps> = ({ tournament: t, anchorRef, className }) => (
  <Link
    ref={anchorRef}
    to="/world-tour/$year/$slug"
    params={tournamentParams(t)}
    className={clsx(classes.mCard, className)}
  >
    <MediaCover src={t.header} fade="strong" className={classes.mMedia}>
      <Countdown tournament={t} className={classes.mCountdown} />
    </MediaCover>
    <div className={classes.mBody}>
      <span className={classes.tagline}>{FINALS_TAGLINE}</span>
      <span className={classes.title}>{t.title}</span>
      <span className={classes.meta}>
        <TournamentPlace tournament={t} cityOnly />
        <span>·</span>
        <span className={utils.num}>{t.dates}</span>
        <span>·</span>
        <span className={utils.num}>{t.prizeLabel}</span>
      </span>
    </div>
  </Link>
);

export const FinaleCard = memo<CardProps & { compact: boolean }>(({ compact, ...props }) =>
  compact ? <CompactCard {...props} /> : <WideCard {...props} />,
);
