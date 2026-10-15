import { memo } from 'react';

import { Tip } from '~/components/ui';

import type { FieldState } from '../fields';

import classes from './StateBadge.module.css';

const STATE_TIPS: Record<FieldState, string> = {
  bwf: 'From BWF',
  override: 'From local override',
  none: 'Missing',
};

export const StateBadge = memo<{ label: string; state: FieldState }>(({ label, state }) => (
  <Tip label={`${label}: ${STATE_TIPS[state]}`}>
    <span className={classes.badge} data-state={state}>
      {label}
    </span>
  </Tip>
));
