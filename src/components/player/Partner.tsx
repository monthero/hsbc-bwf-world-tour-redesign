import { clsx } from 'clsx';
import { memo } from 'react';

import type { Player } from '~/types';

import { PlayerAvatar } from './PlayerAvatar';
import { PlayerName } from './PlayerName';

import classes from './Partner.module.css';

export const Partner = memo<{ player: Player; label?: string | false; short?: boolean; className?: string }>(
  ({ player, label, short, className }) => {
    return (
      <span className={clsx(classes.partner, className)}>
        {label && <span className={classes.label}>{label}</span>}
        <PlayerAvatar player={player} size={20} link />
        <PlayerName player={player} short={short} className={classes.name} />
      </span>
    );
  },
);
