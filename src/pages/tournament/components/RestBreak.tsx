import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { Tip } from '~/components/ui';

import classes from './RestBreak.module.css';

export const RestBreak = memo<{ label: string; active?: boolean; className?: string }>(
  ({ label, active, className }) => (
    <Tip label={label}>
      <span className={clsx(classes.root, className)} data-active={active || undefined}>
        <span className={classes.text}>
          <Trans comment="Short marker in the day strip for a rest day, a day with no matches">Rest</Trans>
        </span>
      </span>
    </Tip>
  ),
);
