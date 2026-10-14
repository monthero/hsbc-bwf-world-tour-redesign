import { clsx } from 'clsx';
import { memo, type FC } from 'react';
import RacketIcon from '~icons/bwf/racket-linear';
import ShoesIcon from '~icons/bwf/shoe-linear';
import StringIcon from '~icons/bwf/strings-linear';
import TensionIcon from '~icons/bwf/tension-linear';

import { Footnote, icon, type IconProps } from '~/components/ui';
import type { FactItem } from '~/types';

import { EQUIPMENT_NOTE } from '../constants';

import classes from './Kit.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

const KIT_ICONS: Record<string, FC<IconProps>> = {
  racket: icon(RacketIcon),
  tension: icon(TensionIcon),
  string: icon(StringIcon),
  shoes: icon(ShoesIcon),
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
  const { brand, model } = item.unit ? { brand: '', model: item.value } : splitBrand(item.value);
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
          {item.unit && <span className={classes.unit}>{item.unit}</span>}
        </span>
        {item.sub && <span className={classes.sub}>{item.sub}</span>}
      </span>
    </div>
  );
});
