import type { FC } from 'react';

import { RankChange } from '~/components/player';

import classes from './Movement.module.css';

export const Movement: FC<{ change: number; isNew: boolean; variant?: 'text' | 'pill' }> = ({
  change,
  isNew,
  variant,
}) => {
  if (isNew)
    return (
      <span className={classes.new} title="New entry">
        New
      </span>
    );
  if (change) return <RankChange value={change} variant={variant} />;
  return (
    <span className={classes.same} title="No change">
      –
    </span>
  );
};
