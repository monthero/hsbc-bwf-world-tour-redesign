import type { FC } from 'react';

import { RankChange } from '~/components/player';
import { TipSpan } from '~/components/ui';

import classes from './Movement.module.css';

export const Movement: FC<{ change: number; isNew: boolean; variant?: 'text' | 'pill' }> = ({
  change,
  isNew,
  variant,
}) => {
  if (isNew)
    return (
      <TipSpan className={classes.new} tip="New entry">
        New
      </TipSpan>
    );
  if (change) return <RankChange value={change} variant={variant} />;
  return (
    <TipSpan className={classes.same} tip="No change">
      –
    </TipSpan>
  );
};
