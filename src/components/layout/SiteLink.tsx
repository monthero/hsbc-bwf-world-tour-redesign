import { ActionIcon, Button, VisuallyHidden } from '@mantine/core';
import { Link, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { IconExternal } from '~/components/ui';

import type { ExternalItem, InternalItem, SiteItem, SocialItem } from './links';

import classes from './SiteLink.module.css';

interface LinkProps<T> {
  item: T;
  className?: string;
  onNavigate?: () => void;
}

export const ExternalLink: FC<LinkProps<ExternalItem>> = ({ item, className, onNavigate }) => {
  const cut = item.label.lastIndexOf(' ') + 1;
  return (
    <a href={item.href} target="_blank" rel="noreferrer" className={clsx(classes.link, className)} onClick={onNavigate}>
      <span>
        {item.label.slice(0, cut)}
        <span className={classes.tail}>
          {item.label.slice(cut)}
          <IconExternal className={classes.external} />
        </span>
      </span>
      <VisuallyHidden>(opens in a new tab)</VisuallyHidden>
    </a>
  );
};

const useSectionActive = (sections: readonly string[]) =>
  useRouterState({ select: (s) => sections.some((p) => s.location.pathname.startsWith(p)) || undefined });

const InternalLink: FC<LinkProps<InternalItem>> = ({ item, className, onNavigate }) => {
  const active = useSectionActive(item.sections);
  return (
    <Link
      to={item.to}
      className={clsx(classes.link, className)}
      data-active={active}
      aria-current={active && 'page'}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  );
};

const SiteLinkBody: FC<LinkProps<SiteItem>> = ({ item, ...rest }) => {
  return 'href' in item ? <ExternalLink item={item} {...rest} /> : <InternalLink item={item} {...rest} />;
};

export const SiteLink = memo(SiteLinkBody);

export const SocialLinks = memo<{ items: readonly SocialItem[]; size?: 'sm' | 'md'; className?: string }>(
  ({ items, size = 'sm', className }) => (
    <ul className={clsx(classes.social, className)} data-size={size}>
      {items.map(({ label, href, icon: Icon }) => (
        <li key={href}>
          {size === 'md' ? (
            <ActionIcon
              component="a"
              href={href}
              target="_blank"
              rel="noreferrer"
              variant="soft"
              color="red"
              radius="xl"
              size={36}
              aria-label={`BWF on ${label}`}
            >
              <Icon />
            </ActionIcon>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={classes.socialLink}
              aria-label={`BWF on ${label}`}
            >
              <Icon />
            </a>
          )}
        </li>
      ))}
    </ul>
  ),
);

export const ExternalButton = memo<{ item: ExternalItem; className?: string }>(({ item, className }) => (
  <Button
    component="a"
    href={item.href}
    target="_blank"
    rel="noreferrer"
    variant="soft"
    color="red"
    radius="xl"
    size="sm"
    rightSection={<IconExternal />}
    className={className}
  >
    {item.label}
  </Button>
));
