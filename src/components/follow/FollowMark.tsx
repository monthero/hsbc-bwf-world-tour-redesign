import { memo } from 'react';

import type { Player } from '~/types';

import { PlayerFollow } from './FollowButton';

export const FollowMark = memo<{ player: Player }>(({ player }) => (
  <PlayerFollow player={player} name={player.name} variant="mark" iconSize={13} />
));
