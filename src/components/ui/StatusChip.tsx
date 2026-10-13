import { Badge } from '@mantine/core';
import { memo, type ReactNode } from 'react';

export type StatusTone = 'gold' | 'red' | 'green' | 'blue' | 'silver';

export const StatusChip = memo<{ tone: StatusTone; icon?: ReactNode; children: ReactNode; className?: string }>(
  ({ tone, icon, children, className }) => (
    <Badge
      variant="tint"
      color={tone}
      size="md"
      radius="xl"
      tt="none"
      fw={600}
      leftSection={icon}
      className={className}
    >
      {children}
    </Badge>
  ),
);
