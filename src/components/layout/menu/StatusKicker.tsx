import { clsx } from 'clsx';
import type { FC } from 'react';

import { LiveDot } from '~/components/ui';
import type { Tournament } from '~/types';
import { isLive, liveOrNextLabel } from '~/utils/tournaments';

import classes from './StatusKicker.module.css';

export const StatusKicker: FC<{ tournament: Tournament; className?: string }> = ({ tournament: t, className }) => (
  <span className={clsx(classes.kicker, className)} data-live={isLive(t) || undefined}>
    {isLive(t) && <LiveDot pulse size={6} />}
    {liveOrNextLabel(t)}
  </span>
);
