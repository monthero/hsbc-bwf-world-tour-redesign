import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { Tip, type IconProps } from '~/components/ui';

import classes from './IconLabel.module.css';

export const IconLabel: FC<{
  icon: FC<IconProps>;
  label: string;
  size?: number;
  children?: ReactNode;
  className?: string;
}> = ({ icon: Icon, label, size = 16, children, className }) => (
  <Tip label={label}>
    <span className={clsx(classes.label, className)}>
      <Icon size={size} className={classes.icon} />
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </span>
  </Tip>
);
