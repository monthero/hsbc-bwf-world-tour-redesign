import { clsx } from 'clsx';
import { memo } from 'react';

import classes from './MenuButton.module.css';

export const MenuButton = memo<{
  id: string;
  controls: string;
  open: boolean;
  onClick: () => void;
  contained?: boolean;
  className?: string;
}>(({ id, controls, open, onClick, contained, className }) => (
  <button
    id={id}
    type="button"
    className={clsx(classes.button, className)}
    aria-label="Menu"
    aria-expanded={open}
    aria-controls={controls}
    data-contained={contained || undefined}
    onClick={onClick}
  >
    <span className={classes.bars} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  </button>
));
