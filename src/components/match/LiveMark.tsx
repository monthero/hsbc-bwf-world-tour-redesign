import { useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import type { FC } from 'react';

import { LiveDot } from '~/components/ui';

import { OUTCOME_LABELS } from './labels';

export const LiveMark: FC<{ label?: string; size?: number; className?: string }> = ({ label, size, className }) => {
  const { i18n } = useLingui();
  return (
    <>
      <LiveDot pulse size={size} className={className} />
      <VisuallyHidden>{label ?? i18n._(OUTCOME_LABELS.Live)}</VisuallyHidden>
    </>
  );
};
