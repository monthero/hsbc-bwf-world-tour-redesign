import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button } from '@mantine/core';
import { Link, type LinkProps } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type FC, type ReactNode } from 'react';

import { IconBack, IconSearch } from '~/components/ui';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { openSearch } from '~/stores/search';
import { NOT_FOUND_META } from '~/utils/meta';

import { labelText, SITE_NAV, type InternalItem, type Label } from './links';

import classes from './NotFound.module.css';
import utils from '~/styles/utils.module.css';

export interface NotFoundAction {
  label: Label;
  link: LinkProps;
}

const CALENDAR: NotFoundAction = { label: msg`Back to the calendar`, link: { to: '/calendar' } };
const DEFAULT_TITLE = msg({
  message: 'That one landed out',
  comment: 'Page-not-found heading, a badminton pun: the shuttle landed outside the court lines',
});
const DEFAULT_DESCRIPTION = msg`The link may be broken, or the page has moved somewhere else on the tour.`;

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
}>(({ title, description, action = CALENDAR, className }) => {
  const { t, i18n } = useLingui();
  return (
    <section className={clsx(utils.container, classes.root, className)}>
      <div className={classes.inner}>
        <Court />
        <span className={classes.call}>
          <span className={clsx(utils.num, classes.code)}>404</span>
          <Trans comment="Page-not-found badge beside 404, like a line judge calling the shuttle out">Out</Trans>
        </span>
        <h1 className={classes.title}>{title ?? i18n._(DEFAULT_TITLE)}</h1>
        <p className={classes.description}>{description ?? i18n._(DEFAULT_DESCRIPTION)}</p>
        <Button
          renderRoot={(props) => <Link {...action.link} {...props} />}
          color="red"
          radius="xl"
          size="md"
          leftSection={<IconBack />}
          className={classes.primary}
        >
          {labelText(i18n, action.label)}
        </Button>
        <nav aria-label={t`Elsewhere on the site`} className={classes.more}>
          {NAV.filter((it) => it.to !== action.link.to).map((it) => (
            <Button key={it.to} component={Link} to={it.to} variant="quiet" radius="xl" size="sm">
              {i18n._(it.label)}
            </Button>
          ))}
          <Button variant="quiet" radius="xl" size="sm" leftSection={<IconSearch />} onClick={openSearch}>
            <Trans comment="Button on the page-not-found screen that opens site search">Search</Trans>
          </Button>
        </nav>
      </div>
    </section>
  );
});

export const PageNotFound: FC = () => {
  useDocumentMeta(NOT_FOUND_META);
  return <NotFound />;
};
