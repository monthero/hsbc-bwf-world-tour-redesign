import type { FC } from 'react'

import {
  IconDouyin,
  IconFacebook,
  IconInstagram,
  IconNewsletter,
  IconWeibo,
  IconX,
  IconYouTube,
  type IconProps,
} from '~/components/ui'

export interface ExternalItem {
  label: string
  href: string
}

export interface InternalItem {
  label: string
  to: '/' | '/about' | '/calendar' | '/rankings' | '/news'
  sections: readonly string[]
}

export type SiteItem = ExternalItem | InternalItem

export interface ItemGroup {
  label: string
  items: readonly ExternalItem[]
}

export type PlatformEntry = ExternalItem | ItemGroup

export interface SocialItem extends ExternalItem {
  icon: FC<IconProps>
}

export const isGroup = (e: PlatformEntry): e is ItemGroup => 'items' in e

export const OFFICIAL_URL = 'https://bwfworldtour.bwfbadminton.com'
export const CURRENT_SITE = 'HSBC BWF World Tour'
export const BWF_SITE = 'BWF'
export const OFFICIAL_SITE: ExternalItem = { label: 'View the official site', href: OFFICIAL_URL }

const BWF_CORPORATE: ExternalItem = { label: 'BWF Corporate', href: 'https://corporate.bwfbadminton.com' }
export const FAN_ZONE: ExternalItem = { label: 'BWF Fan Zone', href: 'https://bwfbadminton.com' }
const WORLD_CHAMPS: ExternalItem = {
  label: 'BWF World Championships',
  href: 'https://bwfworldchampionships.bwfbadminton.com',
}
const THOMAS_UBER: ExternalItem = {
  label: 'BWF Thomas & Uber Cup Finals',
  href: 'https://bwfthomasubercups.bwfbadminton.com',
}
const SUDIRMAN: ExternalItem = { label: 'BWF Sudirman Cup Finals', href: 'https://bwfsudirmancup.bwfbadminton.com' }
const DEVELOPMENT: ExternalItem = { label: 'Development', href: 'https://development.bwfbadminton.com' }
const SHUTTLE_TIME: ExternalItem = { label: 'Shuttle Time', href: 'https://shuttletime.bwfbadminton.com' }

export const PLATFORM_PRIMARY: readonly ExternalItem[] = [FAN_ZONE, WORLD_CHAMPS, THOMAS_UBER]

export const PLATFORM_MORE: readonly PlatformEntry[] = [
  { label: 'HSBC BWF World Tour Finals', href: 'https://bwfworldtourfinals.bwfbadminton.com' },
  SUDIRMAN,
  {
    label: 'Paris 2024',
    items: [
      { label: 'Olympic', href: 'https://olympics.bwfbadminton.com' },
      { label: 'Paralympic', href: 'https://olympics.bwfbadminton.com' },
    ],
  },
  { label: 'Sport For All', items: [DEVELOPMENT, SHUTTLE_TIME] },
  { label: 'Members & Officials', items: [BWF_CORPORATE] },
]

export const NEWSLETTER: ExternalItem = {
  label: 'Newsletter',
  href: 'https://bwfbadminton.us12.list-manage.com/subscribe?u=73460b7def03b0639c64e732c&id=092d7e95a1',
}

export const SITE_NAV: readonly SiteItem[] = [
  { label: 'About', to: '/about', sections: ['/about'] },
  { label: 'Calendar', to: '/calendar', sections: ['/calendar', '/world-tour/'] },
  { label: 'Rankings', to: '/rankings', sections: ['/rankings'] },
  { label: 'News', to: '/news', sections: ['/news'] },
]

export const SOCIAL_LINKS: readonly SocialItem[] = [
  { label: 'Facebook', href: 'https://www.facebook.com/bwfbadminton', icon: IconFacebook },
  { label: 'X', href: 'https://twitter.com/bwfmedia', icon: IconX },
  { label: 'Instagram', href: 'https://www.instagram.com/bwf.official/', icon: IconInstagram },
  { label: 'YouTube', href: 'https://www.youtube.com/user/bwf', icon: IconYouTube },
  { label: 'Weibo', href: 'https://weibo.com/BWFofficial', icon: IconWeibo },
  { label: 'Douyin', href: 'https://v.douyin.com/6YGP1KE/', icon: IconDouyin },
  { ...NEWSLETTER, label: 'Newsletter signup', icon: IconNewsletter },
]

export const FOOTER_GROUPS: readonly { label: string; items: readonly SiteItem[] }[] = [
  { label: 'Explore', items: [...SITE_NAV, NEWSLETTER] },
  {
    label: 'BWF websites',
    items: [
      BWF_CORPORATE,
      FAN_ZONE,
      { label: 'BadmintonWorld.tv', href: 'http://badmintonworld.tv' },
      SUDIRMAN,
      THOMAS_UBER,
      WORLD_CHAMPS,
      DEVELOPMENT,
      SHUTTLE_TIME,
    ],
  },
]

export const BWF_HQ = {
  lines: ['Unit No. 1, Level 29, Naza Tower', 'Platinum Park, No. 10 Persiaran KLCC', '50088 Kuala Lumpur, Malaysia'],
  contact: { label: 'Contact BWF', href: 'http://bwfcorporate.com/about/office/' } satisfies ExternalItem,
}

export const TITLE_PARTNER: ExternalItem = { label: 'HSBC', href: 'https://www.hsbc.com/' }

export const OFFICIAL_LEGAL: readonly ExternalItem[] = [
  { label: 'BWF terms & conditions', href: `${OFFICIAL_URL}/terms-conditions/` },
  { label: 'BWF privacy policy', href: `${OFFICIAL_URL}/terms-conditions/#privacy-policy` },
  { label: 'BWF cookie policy', href: 'https://bwfbadminton.com/cookie-policy/' },
]
