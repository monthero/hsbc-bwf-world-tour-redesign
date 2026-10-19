import { memo, type CSSProperties } from 'react';

import type { RouteLeg } from '../types';

import classes from './MapRoute.module.css';

const ARROW = 'M-4.5 -4L4.5 0L-4.5 4Z';

export const MapRoute = memo<{ leg: RouteLeg }>(({ leg }) => (
  <g className={classes.leg} data-done={leg.done || undefined}>
    <path className={classes.casing} d={leg.d} />
    <path className={classes.line} d={leg.d} />
    <g transform={leg.arrow} style={{ '--cap': leg.cap } as CSSProperties}>
      <path className={classes.arrow} d={ARROW} />
    </g>
  </g>
));
