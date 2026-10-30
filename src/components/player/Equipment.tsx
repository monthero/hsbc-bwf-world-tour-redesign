import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { Footnote, IconRacket, IconShoe, IconStrings, IconTension, Tip, type IconProps } from '~/components/ui';
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

const splitBrand = ({ value, brand }: FactItem) =>
  brand && value.startsWith(`${brand} `)
    ? { brand, model: value.slice(brand.length + 1) }
    : { brand: '', model: value };

const stringTension = (items: readonly FactItem[]) =>
  items.some((q) => q.key === 'string') ? items.find((q) => q.key === 'tension') : undefined;

export const Equipment = memo<{ items: readonly FactItem[]; size?: EquipmentSize; className?: string }>(
  ({ items, size = 'md', className }) => {
    const { t, i18n } = useLingui();
    const tension = size === 'sm' ? stringTension(items) : undefined;
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
            {items.map(
              (q) =>
                q !== tension && (
                  <EquipmentItem key={q.key} item={q} size={size} tension={q.key === 'string' ? tension : undefined} />
                ),
            )}
          </div>
        </section>
      </div>
    );
  },
);

const EquipmentItem = memo<{ item: FactItem; size: EquipmentSize; tension?: FactItem }>(({ item, size, tension }) => {
  const Icon = ICONS[item.key];
  const { brand, model } = splitBrand(item);
  const compact = size === 'sm';
  const icon = Icon && (
    <span className={classes.icon}>
      <Icon size={ICON_SIZE[size]} />
    </span>
  );
  return (
    <div className={classes.item}>
      {icon && compact ? <Tip label={item.label}>{icon}</Tip> : icon}
      <span className={classes.text}>
        {compact ? <VisuallyHidden>{item.label}</VisuallyHidden> : <span className={classes.label}>{item.label}</span>}
        <span className={classes.value} lang={item.lang}>
          {brand && <span className={classes.brand}>{brand}</span>}
          {model}
          {item.unit && <span className={classes.unit}>{item.unit}</span>}
          {compact && item.sub && <span className={classes.extra}>{item.sub}</span>}
          {tension && (
            <span className={classes.extra}>
              <VisuallyHidden>{tension.label}</VisuallyHidden>
              {tension.value}
              {tension.unit && <span className={classes.unit}>{tension.unit}</span>}
              {tension.sub && ` · ${tension.sub}`}
            </span>
          )}
        </span>
        {!compact && item.sub && (
          <span className={classes.sub} lang={item.lang}>
            {item.sub}
          </span>
        )}
      </span>
    </div>
  );
});
