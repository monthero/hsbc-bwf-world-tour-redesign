import type { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { Tip, type IconProps } from '~/components/ui';

import classes from './IconLabel.module.css';

export const IconLabel: FC<{
  icon: FC<IconProps>;
  label: MessageDescriptor;
  size?: number;
  children?: ReactNode;
  className?: string;
}> = ({ icon: Icon, label, size = 16, children, className }) => {
  const { _ } = useLingui();
  const text = _(label);
  return (
    <Tip label={text}>
      <span className={clsx(classes.label, className)}>
        <Icon size={size} className={classes.icon} />
        <VisuallyHidden>{text}</VisuallyHidden>
        {children}
      </span>
    </Tip>
  );
};
