import { memo } from 'react';

import { resultLabel, resultTier } from '../utils';

import classes from './ResultPill.module.css';

export const ResultPill = memo<{ result: number }>(({ result }) => {
  return (
    <span className={classes.pill} data-tier={resultTier(result)}>
      {resultLabel(result)}
    </span>
  );
});
