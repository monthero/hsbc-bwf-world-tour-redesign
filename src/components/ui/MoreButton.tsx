import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { IconCollapse, IconExpand } from './icons';

import classes from './MoreButton.module.css';

const SHOW_MORE = msg({
  message: '{count, plural, one {Show # more} other {Show # more}}',
  comment: 'Button that expands a list to reveal the hidden items',
});

export const MoreButton = memo<{ count: number; expanded?: boolean; onClick: () => void; className?: string }>(
  ({ count, expanded = false, onClick, className }) => {
    const { t, i18n } = useLingui();
    return (
      <button
        type="button"
        className={clsx(classes.more, className)}
        aria-label={
          expanded
            ? t({ message: 'Show fewer', comment: 'Button that collapses an expanded list' })
            : i18n._({ ...SHOW_MORE, values: { count } })
        }
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
    );
  },
);
