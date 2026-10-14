import { memo } from 'react';

import { TipSpan } from '~/components/ui';

import type { FieldState } from '../fields';

import classes from './StateBadge.module.css';

const STATE_TIPS: Record<FieldState, string> = {
  bwf: 'From BWF',
  override: 'From local override',
  none: 'Missing',
};

export const StateBadge = memo<{ label: string; state: FieldState }>(({ label, state }) => (
  <TipSpan className={classes.badge} data-state={state} tip={`${label}: ${STATE_TIPS[state]}`}>
    {label}
  </TipSpan>
));
