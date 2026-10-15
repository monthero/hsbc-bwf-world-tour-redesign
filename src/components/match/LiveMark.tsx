import { VisuallyHidden } from '@mantine/core';
import type { FC } from 'react';

import { LiveDot } from '~/components/ui';

export const LiveMark: FC<{ label?: string; size?: number; className?: string }> = ({
  label = 'Live',
  size,
  className,
}) => (
  <>
    <LiveDot pulse size={size} className={className} />
    <VisuallyHidden>{label}</VisuallyHidden>
  </>
);
