import { clsx } from 'clsx';
import { memo, type FC } from 'react';
import BagIcon from '~icons/solar/bag-4-bold-duotone';
import StringIcon from '~icons/solar/hashtag-square-bold-duotone';
import ShoesIcon from '~icons/solar/running-round-bold-duotone';
import RacketIcon from '~icons/solar/tennis-2-bold-duotone';

import { Footnote, icon, type IconProps } from '~/components/ui';
import type { FactItem } from '~/types';

import { EQUIPMENT_NOTE } from '../constants';

import classes from './Kit.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

const KIT_ICONS: Record<string, FC<IconProps>> = {
  racket: icon(RacketIcon),
  string: icon(StringIcon),
  shoes: icon(ShoesIcon),
  bag: icon(BagIcon),
};

export const Kit = memo<{ items: readonly FactItem[] }>(({ items }) => (
  <section className={clsx(utils.card, classes.kit)} aria-label="Equipment">
    <span className={clsx(shared.label, classes.title)}>
      Kit
      <Footnote note={EQUIPMENT_NOTE} />
    </span>
    <div className={clsx(utils.noScrollbar, classes.items)}>
      {items.map((q) => (
        <KitItem key={q.key} item={q} />
      ))}
    </div>
  </section>
));

const KitItem = memo<{ item: FactItem }>(({ item }) => {
  const Icon = KIT_ICONS[item.key];
  return (
    <div className={classes.item}>
      {Icon && (
        <span className={classes.icon}>
          <Icon size={20} />
        </span>
      )}
      <span className={classes.text}>
        <span className={shared.label}>{item.label}</span>
        <span className={classes.value}>{item.value}</span>
      </span>
    </div>
  );
});
