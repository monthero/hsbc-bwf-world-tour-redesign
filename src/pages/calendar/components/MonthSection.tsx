import { Plural, Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useCallback, type CSSProperties } from 'react';

import { EmptyState } from '~/components/ui';

import type { AnchorRef, MonthGroup } from '../types';
import { EventCard } from './EventCard';
import { EventRow, LiveCard } from './EventRow';

import classes from './MonthSection.module.css';
import timeline from './Timeline.module.css';

export const MonthSection = memo<{
  group: MonthGroup;
  first: boolean;
  isMobile: boolean;
  nextCode: string | undefined;
  targetCode: string | undefined;
  anchorRef: AnchorRef;
  register: (month: number, el: HTMLElement | null) => void;
}>(({ group, first, isMobile, nextCode, targetCode, anchorRef, register }) => {
  const ref = useCallback((el: HTMLElement | null) => register(group.month, el), [register, group.month]);
  const { items } = group;
  const count = items.length;
  return (
    <section
      ref={ref}
      className={clsx(timeline.section, classes.section)}
      data-tone={group.tone}
      data-first={first || undefined}
      style={{ '--p': `${group.progress}%`, '--p2': `${Math.min(100, group.progress + 12)}%` } as CSSProperties}
    >
      <span className={clsx(timeline.line, classes.line)} />
      <span className={clsx(timeline.node, classes.node)} />
      <div className={clsx(timeline.head, classes.head)}>
        <span className={classes.name} data-muted={group.muted || undefined}>
          {group.name}
        </span>
        <span className={classes.count}>
          {count ? (
            <Plural
              value={count}
              one="# event"
              other="# events"
              comment="Number of tournaments in a month of the season calendar"
            />
          ) : (
            '—'
          )}
        </span>
        {group.tone === 'current' && (
          <span className={classes.badge}>
            <Trans comment="Badge on the season calendar marking the current calendar month">This month</Trans>
          </span>
        )}
      </div>
      {items.length ? (
        <div className={clsx(timeline.body, classes.list)}>
          {items.map((t) => {
            const anchor = t.code === targetCode ? anchorRef : undefined;
            const isNext = t.code === nextCode;
            if (!isMobile) return <EventCard key={t.code} tournament={t} isNext={isNext} anchorRef={anchor} />;
            if (t.status === 'live') return <LiveCard key={t.code} tournament={t} anchorRef={anchor} />;
            return <EventRow key={t.code} tournament={t} isNext={isNext} anchorRef={anchor} />;
          })}
        </div>
      ) : (
        <EmptyState className={clsx(timeline.body, classes.empty)}>
          {isMobile ? (
            <Trans comment="Empty state on phones for a calendar month with no World Tour tournaments">
              No World Tour events
            </Trans>
          ) : (
            <Trans comment="Empty state for a calendar month with no World Tour tournaments">
              No World Tour events this month
            </Trans>
          )}
        </EmptyState>
      )}
    </section>
  );
});
