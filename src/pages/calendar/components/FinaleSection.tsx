import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useCallback } from 'react';

import { FinaleCard } from '~/components/tournament';
import { IconTrophy } from '~/components/ui';
import type { Tournament } from '~/types';

import type { AnchorRef } from '../types';
import { monthName } from '../utils';

import classes from './FinaleSection.module.css';
import timeline from './Timeline.module.css';

export const FinaleSection = memo<{
  tournament: Tournament;
  reached: boolean;
  isMobile: boolean;
  anchorRef?: AnchorRef;
  register: (month: number, el: HTMLElement | null) => void;
}>(({ tournament, reached, isMobile, anchorRef, register }) => {
  const ref = useCallback((el: HTMLElement | null) => register(tournament.month, el), [register, tournament.month]);
  const { t } = useLingui();
  const month = monthName(tournament.month);
  return (
    <section
      ref={ref}
      aria-label={t({
        message: `The finale, ${month}`,
        comment: 'Screen-reader label for the calendar section holding the season-ending World Tour Finals, in {month}',
      })}
      className={clsx(timeline.section, classes.section)}
      data-reached={reached || undefined}
    >
      <span className={clsx(timeline.line, classes.line)} />
      <span className={clsx(timeline.node, classes.node)}>
        <IconTrophy size={isMobile ? 12 : 15} />
      </span>
      <div className={clsx(timeline.head, classes.head)}>{month}</div>
      <FinaleCard
        tournament={tournament}
        anchorRef={anchorRef}
        compact={isMobile}
        className={isMobile ? undefined : timeline.body}
      />
    </section>
  );
});
