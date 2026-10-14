import { Tooltip } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { TIP_DELAY } from './useLazyTip';

export const LazyTip: FC<{ target: HTMLElement | null; label: ReactNode }> = ({ target, label }) =>
  target && <Tooltip target={target} label={label} openDelay={TIP_DELAY.open} />;
