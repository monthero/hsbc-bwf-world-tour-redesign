import { useLingui } from '@lingui/react/macro';
import { memo } from 'react';

import { IconButton, IconRecenter, IconZoomIn, IconZoomOut } from '~/components/ui';

import classes from './MapControls.module.css';

export const MapControls = memo<{
  canZoomIn: boolean;
  canZoomOut: boolean;
  atHome: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}>(({ canZoomIn, canZoomOut, atHome, onZoomIn, onZoomOut, onReset }) => {
  const { t } = useLingui();
  const buttons = [
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
      Icon: IconRecenter,
      disabled: atHome,
      onClick: onReset,
      label: t({
        message: 'Reset map view',
        comment:
          'Button on the About page season map that returns to the default view, framed on the live or next tournament',
      }),
    },
  ];
  return (
    <div className={classes.controls} data-no-pan>
      {buttons.map(({ key, Icon, label, disabled, onClick }) => (
        <IconButton
          key={key}
          label={label}
          tip={label}
          shape="rounded"
          className={classes.button}
          disabled={disabled}
          onClick={onClick}
        >
          <Icon size={16} />
        </IconButton>
      ))}
    </div>
  );
});
