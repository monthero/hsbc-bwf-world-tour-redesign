import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import type { FC } from 'react';

import { Tip } from '~/components/ui';

import classes from './SeedTag.module.css';

export const SeedTag: FC<{
  seed: number | null | undefined;
  variant?: 'inline' | 'pill' | 'label';
  className?: string;
}> = ({ seed, variant = 'inline', className }) => {
  const { t } = useLingui();
  if (!seed) return null;
  return (
    <Tip
      label={t({
        message: `Seed ${seed} · seeded by world ranking and placed apart in the draw so top entries can’t meet early`,
        comment:
          'Tooltip on a seed number. In badminton draws, top-ranked players are “seeded”: numbered and spread apart so they can’t meet in early rounds',
      })}
    >
      <span className={clsx(classes.seed, className)} data-variant={variant}>
        {variant === 'inline'
          ? `(${seed})`
          : t({
              message: `Seed ${seed}`,
              comment: 'A player’s seed number in a tournament draw, as a badge or after their world rank, e.g. Seed 3',
            })}
      </span>
    </Tip>
  );
};
