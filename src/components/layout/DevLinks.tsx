import { memo, useMemo } from 'react';

import { IconAdmin, IconButton, IconStudy } from '~/components/ui';

import classes from './DevLinks.module.css';

type Variant = 'ghost' | 'outline' | 'filled' | 'brand';

export const DevLinks = memo<{
  variant?: Variant;
  className?: string;
  buttonClassName?: string;
  onNavigate?: () => void;
}>(({ variant = 'brand', className, buttonClassName, onNavigate }) => {
  const links = useMemo(
    () =>
      ({ admin: { to: '/admin', onClick: onNavigate }, study: { to: '/study-cases', onClick: onNavigate } }) as const,
    [onNavigate],
  );
  if (!import.meta.env.DEV) return null;
  return (
    <span className={className ?? classes.links}>
      <IconButton label="Admin" tip="Admin" variant={variant} link={links.admin} className={buttonClassName}>
        <IconAdmin size={18} />
      </IconButton>
      <IconButton
        label="Study cases"
        tip="Study cases"
        variant={variant}
        link={links.study}
        className={buttonClassName}
      >
        <IconStudy size={18} />
      </IconButton>
    </span>
  );
});
