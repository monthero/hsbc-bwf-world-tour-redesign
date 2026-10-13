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
}>(({ tournament: t, reached, isMobile, anchorRef, register }) => {
  const ref = useCallback((el: HTMLElement | null) => register(t.month, el), [register, t.month]);
  const month = monthName(t.month);
  return (
    <section ref={ref} className={clsx(timeline.section, classes.section)} data-reached={reached || undefined}>
      <span className={clsx(timeline.line, classes.line)} />
      <span className={clsx(timeline.node, classes.node)}>
        <IconTrophy size={isMobile ? 12 : 15} />
      </span>
      {isMobile ? (
        <div className={clsx(timeline.head, classes.head)}>{month} · The finale</div>
      ) : (
        <div className={clsx(timeline.head, classes.head)}>
          {month}
          <span className={classes.sub}>The finale</span>
        </div>
      )}
      <FinaleCard
        tournament={t}
        anchorRef={anchorRef}
        compact={isMobile}
        className={isMobile ? undefined : timeline.body}
      />
    </section>
  );
});
