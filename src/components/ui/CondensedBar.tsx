import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import classes from './CondensedBar.module.css';
import utils from '~/styles/utils.module.css';

export const CondensedBar: FC<{ visible: boolean; children: ReactNode }> = ({ visible, children }) => (
  <div className={classes.anchor}>
    <div className={clsx(utils.glass, classes.bar)} data-visible={visible || undefined} inert={!visible}>
      <div className={clsx(utils.container, classes.row)}>{children}</div>
    </div>
  </div>
);
