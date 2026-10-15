import { VisuallyHidden } from '@mantine/core';
import { memo, type FC } from 'react';

import {
  IconCake,
  IconHand,
  IconHouse,
  IconMapPin,
  IconRuler,
  IconTranslate,
  Tip,
  type IconProps,
  type TipProps,
} from '~/components/ui';
import { joinDots } from '~/utils/format';

const FACT_ICONS: Partial<Record<string, FC<IconProps>>> = {
  age: IconCake,
  height: IconRuler,
  hand: IconHand,
  birthplace: IconMapPin,
  residence: IconHouse,
  languages: IconTranslate,
};

export const FactLabel = memo<{ id: string; label: string; size?: number }>(({ id, label, size }) => {
  const Icon = FACT_ICONS[id];
  if (!Icon) return label;
  return (
    <>
      <Icon size={size} />
      <VisuallyHidden>{label}</VisuallyHidden>
    </>
  );
});

export const FactTip: FC<{ id: string; label: string; note?: string; children: TipProps['children'] }> = ({
  id,
  label,
  note,
  children,
}) => {
  const tip = joinDots([FACT_ICONS[id] && label, note]);
  return tip ? <Tip label={tip}>{children}</Tip> : children;
};
