import { Badge } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type ReactNode } from 'react';

import classes from './StatusChip.module.css';

export type StatusTone = 'gold' | 'red' | 'green' | 'blue' | 'silver';

const TONE_COLOR: Record<StatusTone, string> = {
  gold: 'gold',
  red: 'red',
  green: 'win',
  blue: 'blue',
  silver: 'silver',
};

export const StatusChip = memo<{ tone: StatusTone; icon?: ReactNode; children: ReactNode; className?: string }>(
  ({ tone, icon, children, className }) => (
    <Badge
      variant="tint"
      color={TONE_COLOR[tone]}
      size="md"
      radius="xl"
      tt="none"
      fw={600}
      leftSection={icon}
      data-tone={tone}
      className={clsx(classes.chip, className)}
    >
      {children}
    </Badge>
  ),
);
