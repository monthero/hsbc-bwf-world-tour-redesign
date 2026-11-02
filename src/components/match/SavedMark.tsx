import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { IconLifebuoy, Tip } from '~/components/ui';
import { SAVED_LABEL, type SavedPoints } from '~/utils/live';

import classes from './SavedMark.module.css';
import utils from '~/styles/utils.module.css';

export const SavedMark = memo<{ saved: SavedPoints; mirror?: boolean; className?: string }>(
  ({ saved: { count, total }, mirror, className }) => {
    const { i18n } = useLingui();
    const label = i18n._({ ...SAVED_LABEL, values: { count, total } });
    return (
      <Tip label={label}>
        <span
          className={clsx(utils.raise, classes.saved, className)}
          data-mirror={mirror || undefined}
          aria-label={label}
        >
          <IconLifebuoy className={classes.icon} />
          {count}/{total}
        </span>
      </Tip>
    );
  },
);
