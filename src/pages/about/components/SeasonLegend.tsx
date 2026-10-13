import { memo } from 'react';

import { LEVEL_META, LEVEL_VARS } from '~/constants';

import { LEGEND_LEVELS, LEGEND_STATUS } from '../constants';

import classes from './SeasonLegend.module.css';

export const SeasonLegend = memo<{ compact: boolean }>(({ compact }) => (
  <div className={classes.legend} data-compact={compact || undefined}>
    {!compact && (
      <div className={classes.row}>
        {LEGEND_LEVELS.map((l) => (
          <span key={l} className={classes.item} style={LEVEL_VARS[l]}>
            {LEVEL_META[l].label}
          </span>
        ))}
      </div>
    )}
    <div className={classes.row}>
      {LEGEND_STATUS.map((s) => (
        <span key={s.id} className={classes.item} data-status={s.id}>
          {s.label}
        </span>
      ))}
    </div>
  </div>
));
