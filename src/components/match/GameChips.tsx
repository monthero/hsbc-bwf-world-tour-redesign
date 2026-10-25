import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { Game, Side } from '~/types';
import { GAME_SHORT, gameDone } from '~/utils/live';
import { formatGames, gameWon, opposite } from '~/utils/matches';

import classes from './GameChips.module.css';

const GameChip = memo<{ n: number; game: Game }>(({ n, game }) => {
  const { i18n } = useLingui();
  const finished = gameDone(game);
  const lost = (side: Side) => !finished || gameWon(game, opposite(side)) || undefined;
  const label = i18n._({ ...GAME_SHORT, values: { n } });
  return (
    <li className={classes.game} aria-label={`${label} ${formatGames([game])}`}>
      <span className={classes.value} data-lost={lost(0)} aria-hidden>
        {game[0]}
      </span>
      <span className={classes.label} aria-hidden>
        {label}
      </span>
      <span className={classes.value} data-side="1" data-lost={lost(1)} aria-hidden>
        {game[1]}
      </span>
    </li>
  );
});

export const GameChips = memo<{ games: readonly Game[]; className?: string }>(({ games, className }) =>
  games.length ? (
    <ol className={clsx(classes.chips, className)}>
      {games.map((g, i) => (
        <GameChip key={i} n={i + 1} game={g} />
      ))}
    </ol>
  ) : null,
);
