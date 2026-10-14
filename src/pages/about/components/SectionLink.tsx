import { Link, type LinkProps } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import { IconNext } from '~/components/ui';

import classes from './SectionLink.module.css';

export const SectionLink: FC<{ link: LinkProps; children: ReactNode }> = ({ link, children }) => (
  <Link {...link} className={classes.more}>
    {children}
    <IconNext size={14} />
  </Link>
);
