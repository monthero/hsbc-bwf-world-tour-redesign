import { useLingui } from '@lingui/react/macro';
import { memo, type FC } from 'react';

import {
  IconButton,
  IconRecenter,
  IconRoute,
  IconWholeMap,
  IconZoomIn,
  IconZoomOut,
  type IconProps,
} from '~/components/ui';

import classes from './MapControls.module.css';

export type MapTarget = 'live' | 'next';

interface ControlButton {
  key: string;
  Icon: FC<IconProps>;
  label: string;
  tip?: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const MapControls = memo<{
  canZoomIn: boolean;
  canZoomOut: boolean;
  atWorld: boolean;
  atHome: boolean;
  target: MapTarget | undefined;
  route: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFocus: () => void;
  onRoute: () => void;
}>(({ canZoomIn, canZoomOut, atWorld, atHome, target, route, onZoomIn, onZoomOut, onReset, onFocus, onRoute }) => {
  const { t } = useLingui();
  const focusLabel =
    target === 'live'
      ? t({
          message: 'Zoom to the live tournament',
          comment: 'Button on the About page season map that zooms and pans to the tournament being played right now',
        })
      : t({
          message: 'Zoom to the next tournament',
          comment: 'Button on the About page season map that zooms and pans to the next tournament of the season',
        });
  const buttons: ControlButton[] = [
    {
      key: 'in',
      Icon: IconZoomIn,
      disabled: !canZoomIn,
      onClick: onZoomIn,
      label: t({ message: 'Zoom in', comment: 'Button on the About page season map that zooms the map in' }),
    },
    {
      key: 'out',
      Icon: IconZoomOut,
      disabled: !canZoomOut,
      onClick: onZoomOut,
      label: t({ message: 'Zoom out', comment: 'Button on the About page season map that zooms the map out' }),
    },
    {
      key: 'reset',
      Icon: IconWholeMap,
      disabled: atWorld,
      onClick: onReset,
      label: t({
        message: 'Reset map view',
        comment: 'Button on the About page season map that zooms all the way out to show the whole world map',
      }),
    },
    ...(target ? [{ key: 'focus', Icon: IconRecenter, disabled: atHome, onClick: onFocus, label: focusLabel }] : []),
    {
      key: 'route',
      Icon: IconRoute,
      pressed: route,
      onClick: onRoute,
      label: t({
        message: 'Show route',
        comment:
          'Toggle button on the About page season map that shows or hides the lines and arrows joining the tournaments in season order',
      }),
      tip: route
        ? t({
            message: 'Hide route',
            comment:
              'Tooltip on the About page season map toggle when the route is shown: hides the lines and arrows joining the tournaments in season order',
          })
        : undefined,
    },
  ];
  return (
    <div className={classes.controls} data-no-pan>
      {buttons.map(({ key, Icon, label, tip, pressed, disabled, onClick }) => (
        <IconButton
          key={key}
          label={label}
          tip={tip ?? label}
          shape="rounded"
          className={classes.button}
          active={pressed}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
        >
          <Icon size={16} />
        </IconButton>
      ))}
    </div>
  );
});
