import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { SideScores, TeamPlayers } from '~/components/match';
import { CardHit } from '~/components/ui';
import type { Player, Side } from '~/types';
import { isScheduled, sideResult } from '~/utils/matches';

import { detailsLabel, matchTitle } from '../matches/utils';
import type { BracketBox } from './bracket';

import classes from './Draw.module.css';

const NO_PLAYERS: Player[] = [];

const stateOf = (box: BracketBox, k: Side) => {
  if (!box.teams[k]) return 'tbd';
  if (box.match) return sideResult(box.match, k);
  return box.win === k ? 'won' : undefined;
};

const BoxSide: FC<{ box: BracketBox; k: Side; large: boolean }> = ({ box, k, large }) => {
  const { t } = useLingui();
  const team = box.teams[k];
  return (
    <span className={classes.side} data-state={stateOf(box, k)}>
      <TeamPlayers
        players={team?.players ?? NO_PLAYERS}
        seed={team?.seed}
        flag={large ? 'sm' : 'xs'}
        truncate
        empty={
          box.bye
            ? '—'
            : t({ message: 'TBD', comment: 'Draw slot whose player or pair is not known yet (to be decided)' })
        }
        className={classes.sidePlayers}
      />
      {box.match && (
        <SideScores match={box.match} side={k} withCurrent variant="compact" className={classes.sideScore} />
      )}
    </span>
  );
};

export const DrawBox = memo<{
  box: BracketBox;
  large?: boolean;
  onOpen: (id: string) => void;
}>(({ box, large = false, onOpen }) => {
  const m = box.match;
  const open = !!m && isScheduled(m);
  return (
    <div
      className={clsx(classes.box, large && classes.boxLarge)}
      data-live={m?.status === 'P' || undefined}
      data-tbd={(!m && !box.teams[0] && !box.teams[1]) || undefined}
      data-idle={!open || undefined}
    >
      {open && <CardHit label={detailsLabel(matchTitle(m))} onClick={() => onOpen(m.id)} />}
      <BoxSide box={box} k={0} large={large} />
      <BoxSide box={box} k={1} large={large} />
    </div>
  );
});
