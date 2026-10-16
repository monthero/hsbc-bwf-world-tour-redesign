import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { Footnote, IconRacket, IconShoe, IconStrings, IconTension, type IconProps } from '~/components/ui';
import type { FactItem } from '~/types';

import classes from './Equipment.module.css';
import utils from '~/styles/utils.module.css';

const EQUIPMENT_NOTE = msg({
  message:
    "Players change equipment often, by preference or for sponsorship reasons, so this may be outdated. It's maintained by hand by the site's author. Suggestions are welcome on GitHub.",
  comment: 'Tooltip on the player equipment heading (racket, strings, shoes)',
});

const ICONS: Record<string, FC<IconProps>> = {
  racket: IconRacket,
  tension: IconTension,
  string: IconStrings,
  shoes: IconShoe,
};

const ICON_SIZE = { sm: 14, md: 22 } as const;

type EquipmentSize = keyof typeof ICON_SIZE;

const splitBrand = (value: string) => {
  const space = value.indexOf(' ');
  return space > 0 ? { brand: value.slice(0, space), model: value.slice(space + 1) } : { brand: '', model: value };
};

export const Equipment = memo<{ items: readonly FactItem[]; size?: EquipmentSize; className?: string }>(
  ({ items, size = 'md', className }) => {
    const { t, i18n } = useLingui();
    return (
      <div className={classes.frame} data-size={size}>
        <section
          className={clsx(classes.kit, className)}
          aria-label={t({ message: 'Equipment', comment: 'Player’s badminton gear: racket, string, tension, shoes' })}
        >
          <Footnote note={i18n._(EQUIPMENT_NOTE)} className={clsx(classes.label, classes.title)}>
            <Trans comment="Player’s badminton gear: racket, string, tension, shoes">Equipment</Trans>
          </Footnote>
          <div className={clsx(utils.noScrollbar, classes.items)}>
            {items.map((q) => (
              <EquipmentItem key={q.key} item={q} size={size} />
            ))}
          </div>
        </section>
      </div>
    );
  },
);

const EquipmentItem = memo<{ item: FactItem; size: EquipmentSize }>(({ item, size }) => {
  const Icon = ICONS[item.key];
  const { brand, model } = item.unit ? { brand: '', model: item.value } : splitBrand(item.value);
  return (
    <div className={classes.item}>
      {Icon && (
        <span className={classes.icon}>
          <Icon size={ICON_SIZE[size]} />
        </span>
      )}
      <span className={classes.text}>
        <span className={classes.label}>{item.label}</span>
        <span className={classes.value} lang={item.lang}>
          {brand && <span className={classes.brand}>{brand}</span>}
          {model}
          {item.unit && <span className={classes.unit}>{item.unit}</span>}
        </span>
        {item.sub && (
          <span className={classes.sub} lang={item.lang}>
            {item.sub}
          </span>
        )}
      </span>
    </div>
  );
});
