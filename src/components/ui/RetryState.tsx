import { Trans } from '@lingui/react/macro';
import { Button } from '@mantine/core';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { EmptyState } from './EmptyState';

import classes from './RetryState.module.css';

export const RetryState: FC<{
  message: ReactNode;
  onRetry: () => void;
  compact?: boolean;
  children?: ReactNode;
  className?: string;
}> = ({ message, onRetry, compact, children, className }) => (
  <EmptyState className={clsx(classes.retry, compact && classes.compact, className)}>
    <p className={classes.message}>{message}</p>
    <span className={classes.actions}>
      <Button variant="default" radius="xl" size={compact ? 'xs' : undefined} onClick={onRetry}>
        <Trans comment="Button that reloads data after a loading error">Try again</Trans>
      </Button>
      {children}
    </span>
  </EmptyState>
);
