import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type FC, type ReactNode, type RefCallback } from 'react';

import { MediaCover } from '~/components/ui';
import type { Tournament } from '~/types';
import { finalsCountdown } from '~/utils/season';
import { tournamentParams } from '~/utils/tournaments';

import { LogoTile } from './LogoTile';
import { TournamentPlace } from './TournamentStatus';

import classes from './FinaleCard.module.css';
import utils from '~/styles/utils.module.css';

const FINALS_TAGLINE = (
  <Trans comment="Tagline on the World Tour Finals card: the season’s last event, for the top 8 players or pairs in each of the five events">
    Final stop · Top 8 per discipline
  </Trans>
);

const Countdown: FC<{ tournament: Tournament; className?: string }> = ({ tournament, className }) => {
  const cd = finalsCountdown(tournament);
  return (
    <span className={className}>
      <span className={classes.days}>{cd.value}</span>
      <span className={classes.daysLabel}>{cd.label}</span>
    </span>
  );
};

const Facts: FC<{ tournament: Tournament; place: ReactNode; sepClassName?: string }> = ({
  tournament: t,
  place,
  sepClassName,
}) => (
  <span className={classes.meta}>
    {place}
    <span className={sepClassName}>·</span>
    <span className={utils.num}>{t.dates}</span>
    <span className={sepClassName}>·</span>
    <span className={utils.num}>{t.prizeLabel}</span>
  </span>
);

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
        <Facts tournament={t} place={<TournamentPlace tournament={t} flagSize="md" />} sepClassName={classes.sep} />
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
      <Facts tournament={t} place={<TournamentPlace tournament={t} cityOnly />} />
    </div>
  </Link>
);

export const FinaleCard = memo<CardProps & { compact: boolean }>(({ compact, ...props }) =>
  compact ? <CompactCard {...props} /> : <WideCard {...props} />,
);
