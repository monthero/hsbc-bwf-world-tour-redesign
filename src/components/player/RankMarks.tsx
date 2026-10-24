import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type FC, type ReactNode } from 'react';

import { IconSeed, IconWorldRank, Tip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { EventCode } from '~/types';
import { formatRank } from '~/utils/format';
import { PLAYER_RANK } from '~/utils/meta';

import classes from './RankMarks.module.css';

type MarkVariant = 'inline' | 'pill' | 'label';

const SEED_ICON = <IconSeed className={classes.icon} />;
const RANK_ICON = <IconWorldRank className={classes.icon} />;

const SEED_TIP = msg({
  message: 'Seed {seed} · seeded by world ranking and placed apart in the draw so top entries can’t meet early',
  comment:
    'Tooltip on a seed number. In badminton draws, top-ranked players are “seeded”: numbered and spread apart so they can’t meet in early rounds',
});

const SEED_LABEL = msg({
  message: 'Seed {seed}',
  comment: 'A player’s seed number in a tournament draw, as a badge or after their world rank, e.g. Seed 3',
});

const RANK_TIP = (
  <Trans comment="Tooltip on an entry’s world rank. Category means the event, e.g. men’s singles">
    BWF World Ranking in this category
  </Trans>
);

const Mark: FC<{
  kind: 'seed' | 'rank';
  value: number;
  icon: ReactNode;
  tip: ReactNode;
  label: ReactNode;
  variant: MarkVariant;
  className?: string;
}> = ({ kind, value, icon, tip, label, variant, className }) => (
  <Tip label={tip}>
    <span className={clsx(classes.mark, className)} data-kind={kind} data-variant={variant}>
      <span className={classes.visual} aria-hidden>
        {icon}
        {value}
      </span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  </Tip>
);

export const SeedTag: FC<{
  seed: number | null | undefined;
  variant?: MarkVariant;
  className?: string;
}> = ({ seed, variant = 'inline', className }) => {
  const { i18n } = useLingui();
  if (!seed) return null;
  const tip = i18n._({ ...SEED_TIP, values: { seed } });
  const label = i18n._({ ...SEED_LABEL, values: { seed } });
  if (variant === 'inline')
    return (
      <Tip label={tip}>
        <span className={clsx(classes.mark, className)} data-kind="seed" data-variant={variant}>
          <span aria-hidden>({seed})</span>
          <VisuallyHidden>{label}</VisuallyHidden>
        </span>
      </Tip>
    );
  return (
    <Mark kind="seed" value={seed} icon={SEED_ICON} tip={tip} label={label} variant={variant} className={className} />
  );
};

export const WorldRankTag: FC<{
  rank: number | null | undefined;
  variant?: MarkVariant;
  className?: string;
}> = ({ rank, variant = 'inline', className }) => {
  if (!rank) return null;
  const position = formatRank(rank);
  return (
    <Mark
      kind="rank"
      value={rank}
      icon={RANK_ICON}
      tip={RANK_TIP}
      label={
        <Trans comment="A player’s current world ranking, e.g. “World rank #3”">
          World rank <b>{position}</b>
        </Trans>
      }
      variant={variant}
      className={className}
    />
  );
};

const Part: FC<{ tip: string; className?: string; children: ReactNode }> = ({ tip, className, children }) => (
  <Tip label={tip}>
    <span className={className}>
      <span aria-hidden>{children}</span>
      <VisuallyHidden>{tip}</VisuallyHidden>
    </span>
  </Tip>
);

export const RankSeed = memo<{
  rank: number;
  seed: number | null | undefined;
  event: EventCode;
  className?: string;
}>(({ rank, seed, event, className }) => {
  const { i18n } = useLingui();
  if (!rank && !seed) return null;
  return (
    <span className={clsx(classes.rankSeed, className)}>
      {rank > 0 && (
        <Part tip={i18n._({ ...PLAYER_RANK, values: { discipline: EVENT_NAMES[event], rank } })} className={classes.wr}>
          <Trans comment="Compact world ranking mark after a player’s name on match cards, e.g. “WR6”. WR is short for world ranking; keep it as short as possible and keep the number inside the tags">
            WR<b>{rank}</b>
          </Trans>
        </Part>
      )}
      {!!seed && (
        <Part tip={i18n._({ ...SEED_TIP, values: { seed } })} className={classes.drawSeed}>
          [{seed}]
        </Part>
      )}
    </span>
  );
});
