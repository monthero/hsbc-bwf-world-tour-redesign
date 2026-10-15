import { Link, type LinkProps } from '@tanstack/react-router';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { IconBack } from './icons';
import { Tip } from './Tip';

import classes from './BackPill.module.css';

export const BackPill: FC<{
  children?: ReactNode;
  label?: string;
  iconOnly?: boolean;
  link?: LinkProps;
  onClick?: () => void;
  className?: string;
}> = ({ children, label, iconOnly, link, onClick, className }) => {
  const props = {
    className: clsx(classes.back, className),
    'data-icon-only': iconOnly || undefined,
    'aria-label': iconOnly ? label : undefined,
  };
  const body = (
    <>
      <IconBack size={15} />
      {!iconOnly && children}
    </>
  );
  const el = link ? (
    <Link {...link} {...props}>
      {body}
    </Link>
  ) : (
    <button type="button" {...props} onClick={onClick}>
      {body}
    </button>
  );
  return iconOnly ? (
    <Tip tap={false} label={label}>
      {el}
    </Tip>
  ) : (
    el
  );
};
