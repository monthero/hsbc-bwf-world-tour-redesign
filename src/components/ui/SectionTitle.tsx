import { UnstyledButton } from '@mantine/core';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { IconExpand } from './icons';

import classes from './SectionTitle.module.css';

interface SectionToggle {
  open: boolean;
  onToggle: () => void;
  controls?: string;
}

export const SectionTitle: FC<{
  children: ReactNode;
  icon?: ReactNode;
  count?: ReactNode;
  aside?: ReactNode;
  as?: 'h2' | 'h3' | 'div';
  toggle?: SectionToggle;
  className?: string;
}> = ({ children, icon, count, aside, as: Tag = 'h2', toggle, className }) => {
  const label = (
    <>
      {icon}
      {children}
      {count !== undefined && <span className={classes.sectionCount}>{count}</span>}
    </>
  );
  if (toggle) {
    return (
      <Tag className={clsx(classes.sectionTitle, className)} data-icon={icon ? true : undefined}>
        <UnstyledButton
          className={classes.toggle}
          aria-expanded={toggle.open}
          aria-controls={toggle.controls}
          onClick={toggle.onToggle}
        >
          {label}
          <span className={classes.toggleEnd}>
            {aside}
            <IconExpand size={16} className={classes.chevron} data-open={toggle.open || undefined} />
          </span>
        </UnstyledButton>
      </Tag>
    );
  }
  const title = (
    <Tag className={clsx(classes.sectionTitle, !aside && className)} data-icon={icon ? true : undefined}>
      {label}
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
