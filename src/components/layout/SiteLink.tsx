import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, VisuallyHidden } from '@mantine/core';
import { Link, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { IconExternal } from '~/components/ui';

import { labelText, type ExternalItem, type InternalItem, type SiteItem, type SocialItem } from './links';

import classes from './SiteLink.module.css';

interface LinkProps<T> {
  item: T;
  className?: string;
  onNavigate?: () => void;
}

export const ExternalLink: FC<LinkProps<ExternalItem>> = ({ item, className, onNavigate }) => {
  const { i18n } = useLingui();
  const label = labelText(i18n, item.label);
  const cut = label.lastIndexOf(' ') + 1;
  return (
    <a href={item.href} target="_blank" rel="noreferrer" className={clsx(classes.link, className)} onClick={onNavigate}>
      <span>
        {label.slice(0, cut)}
        <span className={classes.tail}>
          {label.slice(cut)}
          <IconExternal className={classes.external} />
        </span>
      </span>
      <VisuallyHidden>
        <Trans>(opens in a new tab)</Trans>
      </VisuallyHidden>
    </a>
  );
};

const useSectionActive = (sections: readonly string[]) =>
  useRouterState({ select: (s) => sections.some((p) => s.location.pathname.startsWith(p)) || undefined });

const InternalLink: FC<LinkProps<InternalItem>> = ({ item, className, onNavigate }) => {
  const active = useSectionActive(item.sections);
  const { i18n } = useLingui();
  return (
    <Link
      to={item.to}
      className={clsx(classes.link, className)}
      data-active={active}
      aria-current={active && 'page'}
      onClick={onNavigate}
    >
      {i18n._(item.label)}
    </Link>
  );
};

const SiteLinkBody: FC<LinkProps<SiteItem>> = ({ item, ...rest }) => {
  return 'href' in item ? <ExternalLink item={item} {...rest} /> : <InternalLink item={item} {...rest} />;
};

export const SiteLink = memo(SiteLinkBody);

export const SocialLinks = memo<{
  items: readonly SocialItem[];
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}>(({ items, size = 'sm', label: listLabel, className }) => {
  const { t, i18n } = useLingui();
  return (
    <ul className={clsx(classes.social, className)} data-size={size} aria-label={listLabel}>
      {items.map(({ label, href, icon: Icon }) => {
        const site = labelText(i18n, label);
        const link = {
          href,
          target: '_blank',
          rel: 'noreferrer',
          'aria-label': t({
            message: `BWF on ${site}`,
            comment: 'Accessible name of a social link, e.g. “BWF on Instagram”',
          }),
        };
        return (
          <li key={href}>
            {size === 'md' ? (
              <ActionIcon component="a" {...link} variant="soft" color="red" radius="xl" size={36}>
                <Icon />
              </ActionIcon>
            ) : (
              <a {...link} className={classes.socialLink}>
                <Icon />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
});

export const ExternalButton = memo<{ item: ExternalItem; className?: string }>(({ item, className }) => {
  const { i18n } = useLingui();
  return (
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
      {labelText(i18n, item.label)}
    </Button>
  );
});
