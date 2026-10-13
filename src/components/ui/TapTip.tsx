import { Tooltip } from '@mantine/core';
import type { FC, ReactElement, ReactNode } from 'react';

const TAP_EVENTS = { hover: true, focus: true, touch: true };

export const TapTip: FC<{ label: ReactNode; children: ReactElement }> = ({ label, children }) => (
  <Tooltip label={label} events={TAP_EVENTS}>
    {children}
  </Tooltip>
);
