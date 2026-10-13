import { Button } from '@mantine/core';
import { Link, type LinkProps } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type FC, type ReactNode } from 'react';

import { IconBack, IconSearch } from '~/components/ui';
import { NOT_FOUND } from '~/constants';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';
import { openSearch } from '~/stores/search';

import { SITE_NAV, type InternalItem } from './links';

import classes from './NotFound.module.css';
import utils from '~/styles/utils.module.css';

export interface NotFoundAction {
  label: string;
  link: LinkProps;
}

const CALENDAR: NotFoundAction = { label: 'Back to the calendar', link: { to: '/calendar' } };
const DEFAULT_TITLE = 'That one landed out';
const DEFAULT_DESCRIPTION = 'The link may be broken, or the page has moved somewhere else on the tour.';

const COURT_LINES =
  'M0 0H134V61H0Z M0 4.6H134 M0 56.4H134 M7.6 0V61 M126.4 0V61 M47.2 0V61 M86.8 0V61 M0 30.5H47.2 M86.8 30.5H134';
const NAV = SITE_NAV.filter((it): it is InternalItem => 'to' in it);
const FLIGHT = 'M24 44C60 6 112 2 140 15';

const Court = memo(() => (
  <svg viewBox="-6 -10 156 81" className={classes.court} aria-hidden>
    <rect width="134" height="61" className={classes.surface} />
    <path d={COURT_LINES} className={classes.lines} />
    <path d="M67 -4V65" className={classes.net} />
    <path d={FLIGHT} className={classes.flight} />
    <circle cx="140" cy="15" r="2" className={classes.ring} />
    <circle cx="140" cy="15" r="1.6" className={classes.shuttle} />
  </svg>
));

export const NotFound = memo<{
  title?: ReactNode;
  description?: ReactNode;
  action?: NotFoundAction;
  className?: string;
}>(({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, action = CALENDAR, className }) => (
  <section className={clsx(utils.container, classes.root, className)}>
    <div className={classes.inner}>
      <Court />
      <span className={classes.call}>
        <span className={clsx(utils.num, classes.code)}>404</span>
        Out
      </span>
      <h1 className={classes.title}>{title}</h1>
      <p className={classes.description}>{description}</p>
      <Button
        renderRoot={(props) => <Link {...action.link} {...props} />}
        color="red"
        radius="xl"
        size="md"
        leftSection={<IconBack />}
        className={classes.primary}
      >
        {action.label}
      </Button>
      <nav aria-label="Elsewhere on the site" className={classes.more}>
        {NAV.filter((it) => it.to !== action.link.to).map((it) => (
          <Button key={it.to} component={Link} to={it.to} variant="quiet" radius="xl" size="sm">
            {it.label}
          </Button>
        ))}
        <Button variant="quiet" radius="xl" size="sm" leftSection={<IconSearch />} onClick={openSearch}>
          Search
        </Button>
      </nav>
    </div>
  </section>
));

export const PageNotFound: FC = () => {
  useDocumentTitle(NOT_FOUND, 'bwf');
  return <NotFound />;
};
