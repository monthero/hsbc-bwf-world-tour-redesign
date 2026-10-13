import { Badge, type MantineSize } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo, type MouseEvent } from 'react';

import { TapTip } from '~/components/ui';
import type { Retirement } from '~/types';
import { retirementNote } from '~/utils/retirement';

import classes from './RetiredBadge.module.css';

const hold = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

export const RetiredBadge = memo<{ retired: Retirement | undefined; size?: MantineSize; className?: string }>(
  ({ retired, size = 'sm', className }) => {
    const note = useMemo(() => (retired ? retirementNote(retired) : ''), [retired]);
    if (!retired) return null;
    return (
      <TapTip label={note}>
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
