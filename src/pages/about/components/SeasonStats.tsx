import { useLingui } from '@lingui/react/macro';
import { memo } from 'react';

import type { SeasonStat } from '../types';

import classes from './SeasonStats.module.css';

export const SeasonStats = memo<{ stats: SeasonStat[] }>(({ stats }) => {
  const { i18n } = useLingui();
  return (
    <dl className={classes.stats}>
      {stats.map((s) => (
        <div key={s.key} className={classes.stat} data-gold={s.gold || undefined}>
          <dt className={classes.label}>{i18n._(s.label)}</dt>
          <dd className={classes.value}>
            {s.value}
            {s.unit && <small>{s.unit}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
});
