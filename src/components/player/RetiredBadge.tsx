import { Badge, type MantineSize } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo, type MouseEvent } from 'react';

import { TapTip } from '~/components/ui';
import type { Retirement } from '~/types';
import { RETIRED_FROM, retirementNote, retirementRows, retirementSince } from '~/utils/retirement';

import classes from './RetiredBadge.module.css';

const hold = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const RetiredTip = memo<{ retired: Retirement }>(({ retired }) => {
  const since = retirementSince(retired);
  const rows = retirementRows(retired);
  return (
    <div className={classes.tip}>
      <strong className={classes.title}>{RETIRED_FROM}</strong>
      {since && <span className={classes.since}>{since}</span>}
      {rows.length > 0 && (
        <dl className={classes.rows}>
          {rows.map((r) => (
            <div key={r.label} className={classes.row}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
});

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
