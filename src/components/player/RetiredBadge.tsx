import { Badge, type MantineSize } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo, type MouseEvent } from 'react';

import { InfoTip, TapTip } from '~/components/ui';
import type { Retirement } from '~/types';
import { RETIRED_FROM, retirementNote, retirementRows, retirementSince } from '~/utils/retirement';

import classes from './RetiredBadge.module.css';

const hold = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const RetiredTip = memo<{ retired: Retirement }>(({ retired }) => (
  <InfoTip title={RETIRED_FROM} subtitle={retirementSince(retired)} rows={retirementRows(retired)} />
));

export const RetiredBadge = memo<{ retired: Retirement | undefined; size?: MantineSize; className?: string }>(
  ({ retired, size = 'sm', className }) => {
    const note = useMemo(() => (retired ? retirementNote(retired) : ''), [retired]);
    if (!retired) return null;
    return (
      <TapTip label={<RetiredTip retired={retired} />}>
        <Badge
          component="button"
          type="button"
          variant="quiet"
          size={size}
          radius="xl"
          aria-label={note}
          onClick={hold}
          className={clsx(classes.badge, className)}
        >
          Retired
        </Badge>
      </TapTip>
    );
  },
);
