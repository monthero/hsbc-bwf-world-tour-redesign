import { memo, useMemo } from 'react';

import type { PanZoomView } from '~/hooks/usePanZoom';

import type { PinSpot, SeasonFocus } from '../types';
import { anchorVars, flipPopover } from '../utils';
import { MapEventRow } from './MapEventRow';

import classes from './MapPopover.module.css';

export const MapPopover = memo<{
  spot: PinSpot;
  focus: SeasonFocus;
  view: PanZoomView;
  onEnter: () => void;
  onLeave: () => void;
}>(({ spot, focus, view, onEnter, onLeave }) => {
  const style = useMemo(() => anchorVars(spot), [spot]);
  return (
    <div
      className={classes.popover}
      style={style}
      data-flip={flipPopover(spot, view) || undefined}
      data-no-pan
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <MapEventRow tournament={spot.t} focus={focus} />
    </div>
  );
});
