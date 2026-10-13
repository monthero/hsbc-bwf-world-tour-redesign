import { Link, type LinkProps } from '@tanstack/react-router';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { IconBack } from './icons';

import classes from './BackPill.module.css';

export const BackPill: FC<{ children: ReactNode; link?: LinkProps; onClick?: () => void; className?: string }> = ({
  children,
  link,
  onClick,
  className,
}) => {
  const cls = clsx(classes.back, className);
  const body = (
    <>
      <IconBack size={15} />
      {children}
    </>
  );
  if (link)
    return (
      <Link {...link} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" className={cls} onClick={onClick}>
      {body}
    </button>
  );
};
