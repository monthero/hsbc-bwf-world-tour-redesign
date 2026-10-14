import type { FC } from 'react';
import CalendarBold from '~icons/solar/calendar-bold';
import CalendarDuotone from '~icons/solar/calendar-bold-duotone';
import CalendarLinear from '~icons/solar/calendar-linear';
import Home2Bold from '~icons/solar/home-2-bold';
import Home2Duotone from '~icons/solar/home-2-bold-duotone';
import Home2Linear from '~icons/solar/home-2-linear';
import InfoCircleBold from '~icons/solar/info-circle-bold';
import InfoCircleLinear from '~icons/solar/info-circle-linear';
import InfoSquareDuotone from '~icons/solar/info-square-bold-duotone';
import Notebook2Duotone from '~icons/solar/notebook-2-bold-duotone';
import NotebookBold from '~icons/solar/notebook-minimalistic-bold';
import NotebookLinear from '~icons/solar/notebook-minimalistic-linear';
import RankingBold from '~icons/solar/ranking-bold';
import RankingDuotone from '~icons/solar/ranking-bold-duotone';
import RankingLinear from '~icons/solar/ranking-linear';

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
  '/': { blurb: 'Home', icon: icon(Home2Linear), activeIcon: icon(Home2Bold), glyph: icon(Home2Duotone) },
  '/about': {
    blurb: 'How it works',
    icon: icon(InfoCircleLinear),
    activeIcon: icon(InfoCircleBold),
    glyph: icon(InfoSquareDuotone),
  },
  '/calendar': {
    blurb: 'Every stop',
    icon: icon(CalendarLinear),
    activeIcon: icon(CalendarBold),
    glyph: icon(CalendarDuotone),
  },
  '/rankings': {
    blurb: 'World & race',
    icon: icon(RankingLinear),
    activeIcon: icon(RankingBold),
    glyph: icon(RankingDuotone),
  },
  '/news': {
    blurb: 'Latest stories',
    icon: icon(NotebookLinear),
    activeIcon: icon(NotebookBold),
    glyph: icon(Notebook2Duotone),
  },
};

export const NAV_ITEMS: readonly NavItem[] = SITE_NAV.filter(isInternal).map((item, i) => ({
  item,
  index: String(i + 1).padStart(2, '0'),
  ...META[item.to],
}));
