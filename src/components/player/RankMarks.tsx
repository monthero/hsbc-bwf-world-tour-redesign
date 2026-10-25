import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, use, type FC, type ReactNode } from 'react';

import { Tip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { TournamentRankContext } from '~/contexts';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import type { EventCode, Player } from '~/types';
import { PLAYER_RANK } from '~/utils/meta';
import { worldRank } from '~/utils/rankings';

import classes from './RankMarks.module.css';

const SEED_TIP = msg({
  message: 'Seed {seed} · seeded by world ranking and placed apart in the draw so top entries can’t meet early',
  comment:
    'Tooltip on a seed number. In badminton draws, top-ranked players are “seeded”: numbered and spread apart so they can’t meet in early rounds',
});

const TOURNAMENT_RANK = msg({
  message: '{discipline} world No. {rank} going into this tournament',
  comment:
    'Tooltip on a world ranking mark inside a tournament: the player’s ranking in the week the tournament began, e.g. “Men’s singles world No. 3 going into this tournament”',
});

const Mark: FC<{ tip: string; className?: string; children: ReactNode }> = ({ tip, className, children }) => (
  <Tip label={tip}>
    <span className={clsx(classes.mark, className)}>
      <span aria-hidden>{children}</span>
      <VisuallyHidden>{tip}</VisuallyHidden>
    </span>
  </Tip>
);

export const SeedTag: FC<{ seed: number | null | undefined; className?: string }> = ({ seed, className }) => {
  const { i18n } = useLingui();
  if (!seed) return null;
  return (
    <Mark tip={i18n._({ ...SEED_TIP, values: { seed } })} className={clsx(classes.seed, className)}>
      [{seed}]
    </Mark>
  );
};

export const WorldRankTag: FC<{ rank: number | null | undefined; event: EventCode; className?: string }> = ({
  rank,
  event,
  className,
}) => {
  const { i18n } = useLingui();
  const frozen = !!use(TournamentRankContext);
  if (!rank) return null;
  return (
    <Mark
      tip={i18n._({ ...(frozen ? TOURNAMENT_RANK : PLAYER_RANK), values: { discipline: EVENT_NAMES[event], rank } })}
      className={clsx(classes.rank, className)}
    >
      <Trans comment="Compact world ranking mark after a player’s name on match cards, e.g. “WR6”. WR is short for world ranking; keep it as short as possible and keep the number inside the tags">
        WR<b>{rank}</b>
      </Trans>
    </Mark>
  );
};

export const RankSeed = memo<{
  players?: readonly Player[];
  seed: number | null | undefined;
  event?: EventCode;
  rank?: number;
  className?: string;
}>(({ players, seed, event, rank, className }) => {
  const { data: dir } = usePlayerDirectory();
  const rankOf = use(TournamentRankContext);
  let r = rank ?? 0;
  if (rank === undefined && event && players) r = rankOf ? rankOf(players, event) : worldRank(dir, players, event);
  if (!r && !seed) return null;
  return (
    <span className={clsx(classes.rankSeed, className)}>
      {event && <WorldRankTag rank={r} event={event} />}
      <SeedTag seed={seed} />
    </span>
  );
});
