import { clsx } from 'clsx';
import { memo } from 'react';

import { Tip } from '~/components/ui';
import { countryName, flagUrl } from '~/utils/countries';

import classes from './Flag.module.css';

const FLAG_SIZES = { xs: [16, 11], sm: [18, 13], md: [20, 14], lg: [24, 17], xl: [32, 22] } as const;

export type FlagSize = keyof typeof FLAG_SIZES;

export const Flag = memo<{ cc: string; size?: FlagSize; tip?: boolean; className?: string }>(
  ({ cc, size = 'sm', tip = true, className }) => {
    const [w, h] = FLAG_SIZES[size];
    const name = countryName(cc);
    return (
      <Tip label={name} disabled={!tip} tap={false}>
        <img
          className={clsx(classes.flag, className)}
          data-tip={tip && !!name ? true : undefined}
          src={flagUrl(cc)}
          alt={name}
          width={w}
          height={h}
          loading="lazy"
        />
      </Tip>
    );
  },
);
