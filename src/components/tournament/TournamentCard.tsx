import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type FC, type ReactNode } from 'react';

import { IconNext, MediaCover } from '~/components/ui';
import type { Tournament } from '~/types';
import { countdownLabel, tournamentParams } from '~/utils/tournaments';

import { LevelBadge } from './LevelBadge';
import { LogoTile } from './LogoTile';
import { TournamentPlace, TournamentStatusBadge } from './TournamentStatus';

import classes from './TournamentCard.module.css';
import utils from '~/styles/utils.module.css';

const CardStatus: FC<{ tournament: Tournament; isNext: boolean }> = ({ tournament: t, isNext }) => {
  if (t.status === 'live') return <TournamentStatusBadge tournament={t} variant="pill" />;
  if (t.status === 'cancelled') return null;
  if (t.status === 'done')
    return (
      <span className={classes.results}>
        Results
        <IconNext size={14} />
      </span>
    );
  return (
    <span className={classes.countdown} data-next={isNext || undefined}>
      {countdownLabel(t, isNext ? 'long' : 'in')}
    </span>
  );
};

export const TournamentCard = memo<{
  tournament: Tournament;
  isNext?: boolean;
  link?: boolean;
  kicker?: string;
  status?: ReactNode;
  className?: string;
}>(({ tournament: t, isNext = false, link, kicker, status, className }) => {
  const done = t.status === 'done' || t.status === 'cancelled';
  const content = (
    <>
      <MediaCover src={t.header} muted={done} className={classes.media}>
        <LevelBadge level={t.level} variant="glass" dot className={classes.level} />
        {done && <TournamentStatusBadge tournament={t} variant="overlay" className={classes.status} />}
        <LogoTile className={classes.logo} src={t.logo} name={t.name} size={52} />
      </MediaCover>
      <div className={classes.body}>
        {kicker && <span className={classes.kicker}>{kicker}</span>}
        <span className={classes.dates}>{t.dates}</span>
        <span className={classes.title}>{t.title}</span>
        <TournamentPlace tournament={t} className={classes.place} />
        <div className={classes.footer}>
          <span className={classes.prize}>{t.prizeLabel}</span>
          {status ?? <CardStatus tournament={t} isNext={isNext} />}
        </div>
      </div>
    </>
  );
  const props = {
    className: clsx(t.status === 'live' ? utils.live : utils.card, classes.card, className),
    'data-status': t.status,
    'data-next': isNext || undefined,
  };
  if (!link) return <div {...props}>{content}</div>;
  return (
    <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} {...props}>
      {content}
    </Link>
  );
});
