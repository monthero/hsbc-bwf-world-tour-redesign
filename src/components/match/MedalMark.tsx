import { clsx } from 'clsx';
import { memo } from 'react';

import { Medal } from '~/components/tournament/Medal';
import { Tip } from '~/components/ui';
import type { Match, MedalKind, Side } from '~/types';

import { MEDAL_LABELS, medalStake, sideMedal } from './medals';

import classes from './MedalMark.module.css';

const Mark = memo<{ kind: MedalKind; label: string; size: number; trophy?: boolean; className?: string }>(
  ({ kind, label, size, trophy, className }) => (
    <Tip label={label}>
      <span aria-label={label} className={clsx(classes.mark, className)}>
        <Medal kind={kind} size={size} trophy={trophy} />
      </span>
    </Tip>
  ),
);

export const MedalMark = memo<{ round: string; size?: number; className?: string }>(
  ({ round, size = 14, className }) => {
    const stake = medalStake(round);
    return stake && <Mark kind={stake.kind} label={stake.tip} size={size} className={className} />;
  },
);

export const SideMedal = memo<{ match: Match; side: Side; size?: number; className?: string }>(
  ({ match, side, size = 14, className }) => {
    const kind = sideMedal(match, side);
    return kind && <Mark kind={kind} label={MEDAL_LABELS[kind]} size={size} trophy className={className} />;
  },
);
