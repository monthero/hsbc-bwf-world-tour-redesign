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
      <Tip label="New entry">
        <span className={classes.new}>New</span>
      </Tip>
    );
  if (change) return <RankChange value={change} variant={variant} />;
  return (
    <Tip label="No change">
      <span className={classes.same}>–</span>
    </Tip>
  );
};
