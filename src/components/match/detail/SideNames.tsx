import { clsx } from 'clsx';
import { memo } from 'react';

import type { Team } from '~/types';

import { TeamLabel } from '../TeamPlayers';

import classes from './MatchDetail.module.css';

export const SideNames = memo<{ teams: readonly [Team, Team]; className?: string }>(({ teams, className }) => (
  <div className={clsx(classes.sides, className)}>
    <span className={classes.sideName} data-side="a">
      <TeamLabel players={teams[0].players} fit />
    </span>
    <span className={classes.sideName} data-side="b">
      <TeamLabel players={teams[1].players} fit />
    </span>
  </div>
));
