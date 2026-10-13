import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import classes from './EmptyState.module.css';

export const EmptyState: FC<{ children: ReactNode; variant?: 'box' | 'note'; className?: string }> = ({
  children,
  variant = 'box',
  className,
}) => {
  return (
    <div className={clsx(classes.empty, className)} data-variant={variant}>
      {children}
    </div>
  );
};
