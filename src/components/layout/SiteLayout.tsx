import { memo, type ReactNode } from 'react';

import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

import classes from './SiteLayout.module.css';

export const SiteLayout = memo<{ children: ReactNode }>(({ children }) => (
  <div className={classes.layout}>
    <SiteHeader />
    <div className={classes.content}>{children}</div>
    <SiteFooter />
  </div>
));
