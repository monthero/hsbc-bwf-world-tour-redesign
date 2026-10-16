import type { I18n, MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { FC } from 'react';

import {
  IconDouyin,
  IconFacebook,
  IconInstagram,
  IconNewsletter,
  IconWeibo,
  IconX,
  IconYouTube,
  type IconProps,
} from '~/components/ui';

export type Label = string | MessageDescriptor;

export const labelText = (i18n: I18n, label: Label) => (typeof label === 'string' ? label : i18n._(label));

export interface ExternalItem {
  label: Label;
  href: string;
}

export interface InternalItem {
  label: MessageDescriptor;
  to: '/' | '/about' | '/calendar' | '/rankings' | '/news';
  sections: readonly string[];
}

export type SiteItem = ExternalItem | InternalItem;

export interface ItemGroup {
  label: Label;
  items: readonly ExternalItem[];
}

export type PlatformEntry = ExternalItem | ItemGroup;

export interface SocialItem extends ExternalItem {
  icon: FC<IconProps>;
}

export const itemKey = (it: SiteItem) => ('href' in it ? it.href : it.to);

export const isGroup = (e: PlatformEntry): e is ItemGroup => 'items' in e;

export const OFFICIAL_URL = 'https://bwfworldtour.bwfbadminton.com';
export const CURRENT_SITE = 'HSBC BWF World Tour';
export const OFFICIAL_SITE: ExternalItem = {
  label: msg({
    message: 'View the official site',
    comment: 'Footer button linking to the official BWF World Tour website',
  }),
  href: OFFICIAL_URL,
};

const BWF_CORPORATE: ExternalItem = { label: 'BWF Corporate', href: 'https://corporate.bwfbadminton.com' };
export const FAN_ZONE: ExternalItem = { label: 'BWF Fan Zone', href: 'https://bwfbadminton.com' };
const WORLD_CHAMPS: ExternalItem = {
  label: 'BWF World Championships',
  href: 'https://bwfworldchampionships.bwfbadminton.com',
};
const THOMAS_UBER: ExternalItem = {
  label: 'BWF Thomas & Uber Cup Finals',
  href: 'https://bwfthomasubercups.bwfbadminton.com',
};
const SUDIRMAN: ExternalItem = { label: 'BWF Sudirman Cup Finals', href: 'https://bwfsudirmancup.bwfbadminton.com' };
const DEVELOPMENT: ExternalItem = { label: 'Development', href: 'https://development.bwfbadminton.com' };
const SHUTTLE_TIME: ExternalItem = { label: 'Shuttle Time', href: 'https://shuttletime.bwfbadminton.com' };

export const PLATFORM_PRIMARY: readonly ExternalItem[] = [FAN_ZONE, WORLD_CHAMPS, THOMAS_UBER];

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
  {
    label: msg({ message: 'Sport For All', comment: 'Top bar menu group: BWF programmes for grassroots badminton' }),
    items: [DEVELOPMENT, SHUTTLE_TIME],
  },
  {
    label: msg({
      message: 'Members & Officials',
      comment: 'Top bar menu group: BWF sites for member associations and officials',
    }),
    items: [BWF_CORPORATE],
  },
];

export const NEWSLETTER: ExternalItem = {
  label: msg({ message: 'Newsletter', comment: 'Footer link to sign up for the BWF email newsletter' }),
  href: 'https://bwfbadminton.us12.list-manage.com/subscribe?u=73460b7def03b0639c64e732c&id=092d7e95a1',
};

export const SITE_NAV: readonly SiteItem[] = [
  {
    label: msg({ message: 'About', comment: 'Main navigation link to the page about the World Tour' }),
    to: '/about',
    sections: ['/about'],
  },
  {
    label: msg({ message: 'Calendar', comment: 'Main navigation link to the tournament calendar' }),
    to: '/calendar',
    sections: ['/calendar', '/world-tour/'],
  },
  {
    label: msg({ message: 'Rankings', comment: 'Main navigation link to the player rankings' }),
    to: '/rankings',
    sections: ['/rankings'],
  },
  {
    label: msg({ message: 'News', comment: 'Main navigation link to news stories' }),
    to: '/news',
    sections: ['/news'],
  },
];

export const SOCIAL_LINKS: readonly SocialItem[] = [
  { label: 'Facebook', href: 'https://www.facebook.com/bwfbadminton', icon: IconFacebook },
  { label: 'X', href: 'https://twitter.com/bwfmedia', icon: IconX },
  { label: 'Instagram', href: 'https://www.instagram.com/bwf.official/', icon: IconInstagram },
  { label: 'YouTube', href: 'https://www.youtube.com/user/bwf', icon: IconYouTube },
  { label: 'Weibo', href: 'https://weibo.com/BWFofficial', icon: IconWeibo },
  { label: 'Douyin', href: 'https://v.douyin.com/6YGP1KE/', icon: IconDouyin },
  {
    ...NEWSLETTER,
    label: msg({ message: 'Newsletter signup', comment: 'Social link to sign up for the BWF email newsletter' }),
    icon: IconNewsletter,
  },
];

export const BWF_WEBSITES = msg({
  message: 'BWF websites',
  comment: 'Heading for a list of links to other official BWF websites',
});

export const FOOTER_GROUPS: readonly { label: MessageDescriptor; items: readonly SiteItem[] }[] = [
  {
    label: msg({ message: 'Explore', comment: 'Footer heading above links to this site’s pages' }),
    items: [...SITE_NAV, NEWSLETTER],
  },
  {
    label: BWF_WEBSITES,
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
];

export const BWF_HQ = {
  lines: ['Unit No. 1, Level 29, Naza Tower', 'Platinum Park, No. 10 Persiaran KLCC', '50088 Kuala Lumpur, Malaysia'],
  contact: { label: msg`Contact BWF`, href: 'http://bwfcorporate.com/about/office/' } satisfies ExternalItem,
};

export const TITLE_PARTNER: ExternalItem = { label: 'HSBC', href: 'https://www.hsbc.com/' };

export const OFFICIAL_LEGAL: readonly ExternalItem[] = [
  { label: msg`BWF terms & conditions`, href: `${OFFICIAL_URL}/terms-conditions/` },
  { label: msg`BWF privacy policy`, href: `${OFFICIAL_URL}/terms-conditions/#privacy-policy` },
  { label: msg`BWF cookie policy`, href: 'https://bwfbadminton.com/cookie-policy/' },
];
