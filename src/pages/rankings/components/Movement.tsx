import { Trans } from '@lingui/react/macro';
import type { FC } from 'react';

import { RankChange } from '~/components/player';
import { Tip } from '~/components/ui';

import classes from './Movement.module.css';

export const Movement: FC<{ change: number; isNew: boolean; variant?: 'text' | 'pill' }> = ({
  change,
  isNew,
  variant,
}) => {
  if (isNew)
    return (
      <Tip
        label={
          <Trans comment="Tooltip: the player or pair is in the ranking for the first time this week">New entry</Trans>
        }
      >
        <span className={classes.new}>
          <Trans comment="Short tag in the ranking movement column: a new entry this week">New</Trans>
        </span>
      </Tip>
    );
  if (change) return <RankChange value={change} variant={variant} />;
  return (
    <Tip label={<Trans comment="Tooltip: the ranking position is the same as last week">No change</Trans>}>
      <span className={classes.same}>–</span>
    </Tip>
  );
};
