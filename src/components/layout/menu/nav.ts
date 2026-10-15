import type { FC } from 'react';
import Calendar from '~icons/ph/calendar-blank';
import CalendarDuotone from '~icons/ph/calendar-blank-duotone';
import CalendarFill from '~icons/ph/calendar-blank-fill';
import House from '~icons/ph/house';
import HouseDuotone from '~icons/ph/house-duotone';
import HouseFill from '~icons/ph/house-fill';
import Info from '~icons/ph/info';
import InfoDuotone from '~icons/ph/info-duotone';
import InfoFill from '~icons/ph/info-fill';
import Newspaper from '~icons/ph/newspaper';
import NewspaperDuotone from '~icons/ph/newspaper-duotone';
import NewspaperFill from '~icons/ph/newspaper-fill';
import Ranking from '~icons/ph/ranking';
import RankingDuotone from '~icons/ph/ranking-duotone';
import RankingFill from '~icons/ph/ranking-fill';

import { icon, type IconProps } from '~/components/ui';

import { SITE_NAV, type InternalItem, type SiteItem } from '../links';

export interface NavItem {
  item: InternalItem;
  index: string;
  blurb: string;
  icon: FC<IconProps>;
  activeIcon: FC<IconProps>;
  glyph: FC<IconProps>;
}

const isInternal = (i: SiteItem): i is InternalItem => 'to' in i;

const META: Record<InternalItem['to'], Omit<NavItem, 'item' | 'index'>> = {
  '/': { blurb: 'Home', icon: icon(House), activeIcon: icon(HouseFill), glyph: icon(HouseDuotone) },
  '/about': {
    blurb: 'How it works',
    icon: icon(Info),
    activeIcon: icon(InfoFill),
    glyph: icon(InfoDuotone),
  },
  '/calendar': {
    blurb: 'Follow the tour',
    icon: icon(Calendar),
    activeIcon: icon(CalendarFill),
    glyph: icon(CalendarDuotone),
  },
  '/rankings': {
    blurb: 'World & tour',
    icon: icon(Ranking),
    activeIcon: icon(RankingFill),
    glyph: icon(RankingDuotone),
  },
  '/news': {
    blurb: 'Latest stories',
    icon: icon(Newspaper),
    activeIcon: icon(NewspaperFill),
    glyph: icon(NewspaperDuotone),
  },
};

export const NAV_ITEMS: readonly NavItem[] = SITE_NAV.filter(isInternal).map((item, i) => ({
  item,
  index: String(i + 1).padStart(2, '0'),
  ...META[item.to],
}));
