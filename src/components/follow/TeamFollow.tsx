import { memo } from 'react';

import type { Player } from '~/types';

import { PlayerFollow, type FollowLook } from './FollowButton';

import classes from './TeamFollow.module.css';

export const TeamFollow = memo<Omit<FollowLook, 'name' | 'withLabel' | 'className'> & { players: readonly Player[] }>(
  ({ players, box, ...look }) => {
    const pair = players.length > 1;
    return players.map((p) => (
      <span key={p.id || p.name} className={classes.cell}>
        {p.id && (
          <PlayerFollow
            player={p}
            name={p.name}
            box={pair ? 'xs' : box}
            className={pair ? classes.pairStar : undefined}
            {...look}
          />
        )}
      </span>
    ));
  },
);
