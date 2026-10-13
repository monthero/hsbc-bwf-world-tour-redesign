import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import classes from './FloatingPill.module.css';

export const FloatingPill: FC<{
  visible: boolean;
  onClick: () => void;
  children: ReactNode;
  mobileOnly?: boolean;
  className?: string;
}> = ({ visible, onClick, children, mobileOnly, className }) => {
  return (
    <button
      type="button"
      className={clsx(classes.pill, className)}
      data-visible={visible || undefined}
      data-mobile-only={mobileOnly || undefined}
      inert={!visible}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
