import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import classes from './SectionTitle.module.css';

export const SectionTitle: FC<{
  children: ReactNode;
  icon?: ReactNode;
  count?: ReactNode;
  aside?: ReactNode;
  as?: 'h2' | 'h3' | 'div';
  className?: string;
}> = ({ children, icon, count, aside, as: Tag = 'h2', className }) => {
  const title = (
    <Tag className={clsx(classes.sectionTitle, !aside && className)} data-icon={icon ? true : undefined}>
      {icon}
      {children}
      {count !== undefined && <span className={classes.sectionCount}>{count}</span>}
    </Tag>
  );
  if (!aside) return title;
  return (
    <div className={clsx(classes.sectionRow, className)}>
      {title}
      {aside}
    </div>
  );
};
