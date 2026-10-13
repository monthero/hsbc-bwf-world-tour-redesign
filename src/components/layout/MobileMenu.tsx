import { Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { memo } from 'react'

import { IconButton, IconClose, IconMenu } from '~/components/ui'

import { OFFICIAL_SITE, SITE_NAV, SOCIAL_LINKS } from './links'
import { ExternalLink, SiteLink, SocialLinks } from './SiteLink'
import { Wordmark } from './Wordmark'

import classes from './MobileMenu.module.css'

const DRAWER_CLASSES = { content: classes.content, body: classes.body }
const OVERLAY = { backgroundOpacity: 0.62, blur: 4 }

export const MobileMenu = memo(() => {
  const [opened, { open, close }] = useDisclosure(false)
  return (
    <>
      <span className={classes.burger}>
        <IconButton label="Open menu" variant="outline" onClick={open}>
          <IconMenu size={18} />
        </IconButton>
      </span>
      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="min(360px, 88vw)"
        withCloseButton={false}
        padding={0}
        overlayProps={OVERLAY}
        classNames={DRAWER_CLASSES}
        aria-label="Menu"
      >
        <div className={classes.head}>
          <Wordmark onNavigate={close} />
          <IconButton label="Close menu" variant="ghost" onClick={close}>
            <IconClose size={18} />
          </IconButton>
        </div>
        <nav aria-label="Main" className={classes.nav}>
          {SITE_NAV.map((it) => (
            <SiteLink key={it.label} item={it} onNavigate={close} className={classes.link} />
          ))}
        </nav>
        <div className={classes.foot}>
          <span className={classes.label}>Follow BWF</span>
          <SocialLinks items={SOCIAL_LINKS} size="md" className={classes.social} />
          <ExternalLink item={OFFICIAL_SITE} className={classes.official} />
        </div>
      </Drawer>
    </>
  )
})
