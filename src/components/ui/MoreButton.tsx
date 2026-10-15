import { clsx } from 'clsx';
import { memo } from 'react';

import { IconCollapse, IconExpand } from './icons';

import classes from './MoreButton.module.css';

export const MoreButton = memo<{ count: number; expanded?: boolean; onClick: () => void; className?: string }>(
  ({ count, expanded = false, onClick, className }) => (
    <button
      type="button"
      className={clsx(classes.more, className)}
      aria-label={expanded ? 'Show fewer' : `Show ${count} more`}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {expanded ? (
        <IconCollapse size={14} />
      ) : (
        <>
          +{count}
          <IconExpand size={14} />
        </>
      )}
    </button>
  ),
);
