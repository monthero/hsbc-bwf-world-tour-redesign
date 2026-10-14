import { clsx } from 'clsx';
import { memo, type FC } from 'react';
import BagIcon from '~icons/bwf/racket-bag-linear';
import RacketIcon from '~icons/bwf/racket-linear';
import ShoesIcon from '~icons/bwf/shoe-linear';
import StringIcon from '~icons/bwf/strings-linear';

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
    <Footnote note={EQUIPMENT_NOTE} className={clsx(shared.label, classes.title)}>
      Equipment
    </Footnote>
    <div className={clsx(utils.noScrollbar, classes.items)}>
      {items.map((q) => (
        <KitItem key={q.key} item={q} />
      ))}
    </div>
  </section>
));

const splitBrand = (value: string) => {
  const space = value.indexOf(' ');
  return space > 0 ? { brand: value.slice(0, space), model: value.slice(space + 1) } : { brand: '', model: value };
};

const KitItem = memo<{ item: FactItem }>(({ item }) => {
  const Icon = KIT_ICONS[item.key];
  const { brand, model } = splitBrand(item.value);
  return (
    <div className={classes.item}>
      {Icon && (
        <span className={classes.icon}>
          <Icon size={22} />
        </span>
      )}
      <span className={classes.text}>
        <span className={shared.label}>{item.label}</span>
        <span className={classes.value}>
          {brand && <span className={classes.brand}>{brand}</span>}
          {model}
        </span>
      </span>
    </div>
  );
});
