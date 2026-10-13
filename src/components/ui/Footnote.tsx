import type { FC } from 'react';

import { TapTip } from './TapTip';

import classes from './Footnote.module.css';

export const Footnote: FC<{ note: string }> = ({ note }) => (
  <TapTip label={note}>
    <button type="button" className={classes.mark} aria-label={note}>
      *
    </button>
  </TapTip>
);
