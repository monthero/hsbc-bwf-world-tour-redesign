import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, type MantineSize } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo, type MouseEvent } from 'react';

import { InfoTip, Tip } from '~/components/ui';
import type { Retirement } from '~/types';
import { RETIRED_FROM, retirementNote, retirementRows, retirementSince } from '~/utils/retirement';

import classes from './RetiredBadge.module.css';

const hold = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const RetiredTip = memo<{ retired: Retirement }>(({ retired }) => {
  const { i18n } = useLingui();
  return <InfoTip title={i18n._(RETIRED_FROM)} subtitle={retirementSince(retired)} rows={retirementRows(retired)} />;
});

export const RetiredBadge = memo<{ retired: Retirement | undefined; size?: MantineSize; className?: string }>(
  ({ retired, size = 'sm', className }) => {
    const note = useMemo(() => (retired ? retirementNote(retired) : ''), [retired]);
    if (!retired) return null;
    return (
      <Tip label={<RetiredTip retired={retired} />}>
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
          <Trans
            context="player status"
            comment="Badge on a player who has retired from international badminton (not a match that ended by retirement)"
          >
            Retired
          </Trans>
        </Badge>
      </Tip>
    );
  },
);
