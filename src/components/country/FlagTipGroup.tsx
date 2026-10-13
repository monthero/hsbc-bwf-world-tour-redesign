import { Tooltip } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { TIP_DELAY } from '~/components/ui';

export const FlagTipGroup: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Tooltip.Group openDelay={TIP_DELAY.open} closeDelay={TIP_DELAY.close}>
      {children}
    </Tooltip.Group>
  );
};
