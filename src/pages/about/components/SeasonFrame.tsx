import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { SectionTitle } from '~/components/ui';

import utils from '~/styles/utils.module.css';

export const SeasonFrame: FC<{ year: number; count?: ReactNode; className?: string; children: ReactNode }> = ({
  year,
  count,
  className,
  children,
}) => {
  const { t } = useLingui();
  return (
    <section
      className={clsx(utils.card, className)}
      aria-label={t({
        message: `${year} season map`,
        comment:
          'Screen-reader label for the About page card with a world map and timeline of the {year} World Tour season',
      })}
    >
      <SectionTitle count={count}>
        {t({
          message: `${year} season`,
          comment: 'About page heading of the card mapping the {year} World Tour season',
        })}
      </SectionTitle>
      {children}
    </section>
  );
};
