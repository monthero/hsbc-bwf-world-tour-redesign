import { memo, type FC, type ReactNode } from 'react';

import { DARK_SCOPE } from '~/theme';

import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

import classes from './SiteLayout.module.css';

const Chrome: FC<{ children: ReactNode }> = ({ children }) => (
  <div className={classes.chrome} style={DARK_SCOPE} data-mantine-color-scheme="dark">
    {children}
  </div>
);

export const SiteLayout = memo<{ children: ReactNode }>(({ children }) => (
  <div className={classes.layout}>
    <Chrome>
      <SiteHeader />
    </Chrome>
    <div className={classes.content}>{children}</div>
    <Chrome>
      <SiteFooter />
    </Chrome>
  </div>
));
