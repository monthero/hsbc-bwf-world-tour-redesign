import { clsx } from 'clsx';
import { memo } from 'react';

import type { Match, Side } from '~/types';
import { gameWon } from '~/utils/matches';
import { perspectiveGames } from '~/utils/season';

import classes from './ScoreChips.module.css';

export const ScoreChips = memo<{ match: Match; side: Side; size?: 'sm' | 'md' }>(({ match, side, size = 'md' }) => {
  const games = perspectiveGames(match, side);
  if (!games.length) return null;
  return (
    <span className={classes.chips} data-size={size}>
      {games.map((g) => (
        <span key={g.key} className={classes.chip} data-state={g.state}>
          <span className={classes.me}>{g.me}</span>
          <span className={classes.opp}>{g.opp}</span>
        </span>
      ))}
    </span>
  );
});

export const SideScores = memo<{
  match: Match;
  side: Side;
  slots?: number;
  withCurrent?: boolean;
  variant?: 'card' | 'live' | 'compact';
  className?: string;
}>(({ match: m, side, slots, withCurrent, variant = 'card', className }) => {
  const count = Math.max(slots ?? 0, m.games.length);
  const cells = Array.from({ length: count }, (_, i) => m.games[i]);
  const current = withCurrent && m.current ? m.current[side] : null;
  return (
    <span className={clsx(classes.scores, className)} data-variant={variant}>
      {cells.map((g, i) => (
        <span key={i} className={classes.score} data-won={(g && gameWon(g, side)) || undefined}>
          {g?.[side] ?? ''}
        </span>
      ))}
      {current !== null && (
        <span className={classes.current} data-live>
          {current}
        </span>
      )}
    </span>
  );
});
