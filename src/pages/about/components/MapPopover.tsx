import { memo, useMemo } from 'react';

import type { PinSpot, SeasonFocus } from '../types';
import { anchorVars, flipPopover } from '../utils';
import { MapEventRow } from './MapEventRow';

import classes from './MapPopover.module.css';

export const MapPopover = memo<{
  spot: PinSpot;
  focus: SeasonFocus;
  onEnter: () => void;
  onLeave: () => void;
}>(({ spot, focus, onEnter, onLeave }) => {
  const style = useMemo(() => anchorVars(spot), [spot]);
  return (
    <div
      className={classes.popover}
      style={style}
      data-flip={flipPopover(spot) || undefined}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <MapEventRow tournament={spot.t} focus={focus} />
    </div>
  );
});
