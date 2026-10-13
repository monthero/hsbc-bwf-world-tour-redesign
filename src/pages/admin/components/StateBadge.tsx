import { memo } from 'react'

import type { FieldState } from '../fields'

import classes from './StateBadge.module.css'

const STATE_TIPS: Record<FieldState, string> = {
  bwf: 'From BWF',
  override: 'From local override',
  none: 'Missing',
}

export const StateBadge = memo<{ label: string; state: FieldState }>(({ label, state }) => (
  <span className={classes.badge} data-state={state} title={`${label}: ${STATE_TIPS[state]}`}>
    {label}
  </span>
))
