import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type CSSProperties } from 'react';

import { ShuttleIcon, Tip } from '~/components/ui';

import classes from './ServeMark.module.css';

export const ServeMark = memo<{ size?: number; className?: string }>(({ size = 14, className }) => {
  const { t } = useLingui();
  return (
    <Tip
      label={t({
        message: 'Serving',
        comment: 'Tooltip on the shuttle icon marking which side is serving in a live match',
      })}
    >
      <span className={clsx(classes.serve, className)} style={{ '--serve': `${size}px` } as CSSProperties}>
        <ShuttleIcon />
      </span>
    </Tip>
  );
});
