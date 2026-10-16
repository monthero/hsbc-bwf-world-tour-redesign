import { useLingui } from '@lingui/react/macro';
import { Menu } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, type ButtonHTMLAttributes, type FC, type Ref } from 'react';

import { IconCheck, IconExpand, IconExternal, IconNext } from '~/components/ui';

import { BwfMark } from './BwfMark';
import {
  BWF_WEBSITES,
  CURRENT_SITE,
  isGroup,
  labelText,
  PLATFORM_MORE,
  PLATFORM_PRIMARY,
  SOCIAL_LINKS,
  type ExternalItem,
  type PlatformEntry,
} from './links';
import { ExternalLink, SocialLinks } from './SiteLink';

import classes from './PlatformBar.module.css';
import utils from '~/styles/utils.module.css';

const MENU_CLASSES = {
  dropdown: clsx(utils.popover, classes.menu),
  item: classes.menuItem,
  label: classes.menuLabel,
  divider: classes.menuDivider,
};

const MenuLink: FC<{ item: ExternalItem }> = ({ item }) => {
  const { i18n } = useLingui();
  return (
    <Menu.Item
      component="a"
      href={item.href}
      target="_blank"
      rel="noreferrer"
      rightSection={<IconExternal className={classes.menuIcon} />}
    >
      {labelText(i18n, item.label)}
    </Menu.Item>
  );
};

const MoreEntry: FC<{ entry: PlatformEntry }> = ({ entry }) => {
  const { i18n } = useLingui();
  if (!isGroup(entry)) return <MenuLink item={entry} />;
  return (
    <Menu.Sub>
      <Menu.Sub.Target>
        <Menu.Sub.Item rightSection={<IconNext className={classes.menuIcon} />}>
          {labelText(i18n, entry.label)}
        </Menu.Sub.Item>
      </Menu.Sub.Target>
      <Menu.Sub.Dropdown className={MENU_CLASSES.dropdown}>
        {entry.items.map((it) => (
          <MenuLink key={labelText(i18n, it.label)} item={it} />
        ))}
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  );
};

const SwitcherEntry: FC<{ entry: PlatformEntry }> = ({ entry }) => {
  const { i18n } = useLingui();
  if (!isGroup(entry)) return <MenuLink item={entry} />;
  return (
    <>
      <Menu.Label>{labelText(i18n, entry.label)}</Menu.Label>
      {entry.items.map((it) => (
        <MenuLink key={labelText(i18n, it.label)} item={it} />
      ))}
    </>
  );
};

const CurrentSite: FC<{ className?: string }> = ({ className }) => (
  <Link to="/" className={className} aria-current="page">
    {CURRENT_SITE}
  </Link>
);

const Trigger: FC<ButtonHTMLAttributes<HTMLButtonElement> & { label: string; ref?: Ref<HTMLButtonElement> }> = ({
  label,
  ...rest
}) => (
  <button type="button" {...rest}>
    {label}
    <IconExpand className={classes.chevron} />
  </button>
);

const FamilyLinks: FC = () => {
  const { t, i18n } = useLingui();
  return (
    <nav className={classes.family} aria-label={i18n._(BWF_WEBSITES)}>
      {PLATFORM_PRIMARY.map((it) => (
        <ExternalLink key={it.href} item={it} className={classes.familyLink} />
      ))}
      <CurrentSite className={clsx(classes.familyLink, classes.current)} />
      <Menu position="bottom-end" offset={6} classNames={MENU_CLASSES} width={260}>
        <Menu.Target>
          <Trigger
            label={t({ message: 'More', comment: 'Top bar menu button listing more BWF websites' })}
            className={classes.familyLink}
          />
        </Menu.Target>
        <Menu.Dropdown>
          {PLATFORM_MORE.map((e) => (
            <MoreEntry key={labelText(i18n, e.label)} entry={e} />
          ))}
        </Menu.Dropdown>
      </Menu>
    </nav>
  );
};

const FamilySwitcher: FC = () => {
  const { i18n } = useLingui();
  return (
    <Menu position="bottom-start" offset={6} classNames={MENU_CLASSES} width={280}>
      <Menu.Target>
        <Trigger label={CURRENT_SITE} className={clsx(classes.switcher, classes.current)} />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{i18n._(BWF_WEBSITES)}</Menu.Label>
        <Menu.Item
          component={Link}
          to="/"
          aria-current="page"
          className={classes.current}
          rightSection={<IconCheck className={classes.menuIcon} />}
        >
          {CURRENT_SITE}
        </Menu.Item>
        {PLATFORM_PRIMARY.map((it) => (
          <MenuLink key={it.href} item={it} />
        ))}
        <Menu.Divider />
        {PLATFORM_MORE.map((e) => (
          <SwitcherEntry key={labelText(i18n, e.label)} entry={e} />
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

export const PlatformBar = memo(() => (
  <div className={clsx(utils.onBrand, classes.bar)}>
    <div className={clsx(utils.container, classes.inner)}>
      <BwfMark className={classes.bwf} />
      <FamilyLinks />
      <FamilySwitcher />
      <SocialLinks items={SOCIAL_LINKS} className={classes.social} />
    </div>
  </div>
));
