import { Menu } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { memo, type ButtonHTMLAttributes, type FC, type Ref } from 'react'

import { IconCheck, IconExpand, IconExternal, IconNext } from '~/components/ui'

import { BwfMark } from './BwfMark'
import {
  CURRENT_SITE,
  isGroup,
  PLATFORM_MORE,
  PLATFORM_PRIMARY,
  SOCIAL_LINKS,
  type ExternalItem,
  type PlatformEntry,
} from './links'
import { ExternalLink, SocialLinks } from './SiteLink'

import classes from './PlatformBar.module.css'
import utils from '~/styles/utils.module.css'

const MENU_CLASSES = {
  dropdown: clsx(utils.popover, classes.menu),
  item: classes.menuItem,
  label: classes.menuLabel,
  divider: classes.menuDivider,
}

const MenuLink: FC<{ item: ExternalItem }> = ({ item }) => (
  <Menu.Item
    component="a"
    href={item.href}
    target="_blank"
    rel="noreferrer"
    rightSection={<IconExternal className={classes.menuIcon} />}
  >
    {item.label}
  </Menu.Item>
)

const MoreEntry: FC<{ entry: PlatformEntry }> = ({ entry }) => {
  if (!isGroup(entry)) return <MenuLink item={entry} />
  return (
    <Menu.Sub>
      <Menu.Sub.Target>
        <Menu.Sub.Item rightSection={<IconNext className={classes.menuIcon} />}>{entry.label}</Menu.Sub.Item>
      </Menu.Sub.Target>
      <Menu.Sub.Dropdown className={clsx(utils.popover, classes.menu)}>
        {entry.items.map((it) => (
          <MenuLink key={it.label} item={it} />
        ))}
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  )
}

const SwitcherEntry: FC<{ entry: PlatformEntry }> = ({ entry }) => {
  if (!isGroup(entry)) return <MenuLink item={entry} />
  return (
    <>
      <Menu.Label>{entry.label}</Menu.Label>
      {entry.items.map((it) => (
        <MenuLink key={it.label} item={it} />
      ))}
    </>
  )
}

const CurrentSite: FC<{ className?: string }> = ({ className }) => (
  <Link to="/" className={className} aria-current="page">
    {CURRENT_SITE}
  </Link>
)

const Trigger: FC<ButtonHTMLAttributes<HTMLButtonElement> & { label: string; ref?: Ref<HTMLButtonElement> }> = ({
  label,
  ...rest
}) => (
  <button type="button" {...rest}>
    {label}
    <IconExpand className={classes.chevron} />
  </button>
)

const FamilyLinks: FC = () => (
  <nav className={classes.family} aria-label="BWF websites">
    {PLATFORM_PRIMARY.map((it) => (
      <ExternalLink key={it.href} item={it} className={classes.familyLink} />
    ))}
    <CurrentSite className={clsx(classes.familyLink, classes.current)} />
    <Menu position="bottom-end" offset={6} classNames={MENU_CLASSES} width={260}>
      <Menu.Target>
        <Trigger label="More" className={classes.familyLink} />
      </Menu.Target>
      <Menu.Dropdown>
        {PLATFORM_MORE.map((e) => (
          <MoreEntry key={e.label} entry={e} />
        ))}
      </Menu.Dropdown>
    </Menu>
  </nav>
)

const FamilySwitcher: FC = () => (
  <Menu position="bottom-start" offset={6} classNames={MENU_CLASSES} width={280}>
    <Menu.Target>
      <Trigger label={CURRENT_SITE} className={clsx(classes.switcher, classes.current)} />
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Label>BWF websites</Menu.Label>
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
        <SwitcherEntry key={e.label} entry={e} />
      ))}
    </Menu.Dropdown>
  </Menu>
)

export const PlatformBar = memo(() => (
  <div className={clsx(utils.onBrand, classes.bar)}>
    <div className={clsx(utils.container, classes.inner)}>
      <BwfMark className={classes.bwf} />
      <FamilyLinks />
      <FamilySwitcher />
      <SocialLinks items={SOCIAL_LINKS} className={classes.social} />
    </div>
  </div>
))
