import { clsx } from 'clsx';
import { memo } from 'react';

import type { Player } from '~/types';

import { PlayerAvatar } from './PlayerAvatar';

import classes from './TeamPhoto.module.css';

export const TeamPhoto = memo<{ players: readonly Player[]; className?: string }>(({ players, className }) => (
  <span className={clsx(classes.tile, className)} data-pair={players.length > 1 || undefined}>
    {players.map((p) => (
      <PlayerAvatar key={p.id} player={p} className={classes.photo} />
    ))}
  </span>
));
