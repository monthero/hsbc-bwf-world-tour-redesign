import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import type { FC } from 'react';

import { Flag, type FlagSize } from '~/components/country';
import { LiveMark } from '~/components/match';
import { IconCheck, IconClose, IconTimer } from '~/components/ui';
import type { Tournament, TournamentStatus } from '~/types';
import { statusLabel } from '~/utils/tournaments';

import classes from './TournamentStatus.module.css';
import utils from '~/styles/utils.module.css';

type StatusVariant = 'overlay' | 'inline' | 'pill' | 'line' | 'tag';

const MARKS: Record<Exclude<TournamentStatus, 'live'>, typeof IconCheck> = {
  done: IconCheck,
  cancelled: IconClose,
  up: IconTimer,
};

const StatusText: FC<{ tournament: Tournament; variant: StatusVariant; short?: boolean }> = ({
  tournament: t,
  variant,
  short,
}) => {
  if (t.status !== 'live') return statusLabel(t);
  const total = short || (variant !== 'pill' && variant !== 'overlay');
  const day = t.dayNumber;
  const days = t.totalDays;
  return (
    <span>
      {total ? (
        <Trans comment="Status of a tournament in progress, e.g. “Day 3 of 6”">
          Day {day}
          <span className={short ? classes.wide : undefined}> of {days}</span>
        </Trans>
      ) : (
        <Trans comment="Status of a tournament in progress, e.g. “Day 3”">Day {day}</Trans>
      )}
    </span>
  );
};

const StatusMark: FC<{ tournament: Tournament; variant: StatusVariant }> = ({ tournament: t, variant }) => {
  if (t.status === 'live') return <LiveMark size={variant === 'line' ? 7 : 6} />;
  if (variant !== 'overlay') return null;
  const Icon = MARKS[t.status];
  return <Icon size={13} className={classes.mark} />;
};

export const TournamentStatusBadge: FC<{
  tournament: Tournament;
  variant?: StatusVariant;
  short?: boolean;
  className?: string;
}> = ({ tournament: t, variant = 'inline', short, className }) => (
  <span
    className={clsx(classes.status, variant === 'overlay' && utils.glassTag, className)}
    data-variant={variant}
    data-status={t.status}
  >
    <StatusMark tournament={t} variant={variant} />
    <StatusText tournament={t} variant={variant} short={short} />
  </span>
);

export const TournamentPlace: FC<{
  tournament: Tournament;
  flagSize?: FlagSize;
  cityOnly?: boolean;
  className?: string;
}> = ({ tournament: t, flagSize, cityOnly, className }) => {
  return (
    <span className={clsx(classes.place, className)}>
      {t.cc && <Flag cc={t.cc} size={flagSize} tip={!!cityOnly} />}
      {cityOnly ? t.city : t.place}
    </span>
  );
};
