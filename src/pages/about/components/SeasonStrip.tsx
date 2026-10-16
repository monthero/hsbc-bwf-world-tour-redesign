import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { memo, useCallback, useMemo, type KeyboardEvent } from 'react';

import { LEVEL_VARS } from '~/constants';
import type { Tournament } from '~/types';
import { today } from '~/utils/dates';
import { tournamentParams } from '~/utils/tournaments';

import type { OnActive, SeasonFocus } from '../types';
import { monthTicks, stripBox, todayOffset, yearSpan } from '../utils';
import { SpotHalo } from './SpotHalo';

import classes from './SeasonStrip.module.css';

type Span = ReturnType<typeof yearSpan>;

const StripMark = memo<{
  tournament: Tournament;
  span: Span;
  active: boolean;
  isSpot: boolean;
  isFinals: boolean;
  onActive: OnActive;
}>(({ tournament: t, span, active, isSpot, isFinals, onActive }) => {
  const style = useMemo(() => ({ ...LEVEL_VARS[t.level], ...stripBox(t, span) }), [t, span]);
  const enter = useCallback(() => onActive(t.code), [onActive, t.code]);
  const leave = useCallback(() => onActive(null), [onActive]);
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onActive(null);
    },
    [onActive],
  );
  return (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      className={classes.mark}
      style={style}
      aria-label={`${t.name}, ${t.dates}`}
      data-status={t.status}
      data-spot={isSpot || undefined}
      data-finals={isFinals || undefined}
      data-active={active || undefined}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onKeyDown={onKeyDown}
    >
      <i />
      {isSpot && <SpotHalo live={t.status === 'live'} solid className={classes.spot} />}
    </Link>
  );
});

export const SeasonStrip = memo<{
  tournaments: Tournament[];
  year: number;
  focus: SeasonFocus;
  active: Tournament | undefined;
  onActive: OnActive;
}>(({ tournaments, year, focus, active, onActive }) => {
  const { t } = useLingui();
  const span = useMemo(() => yearSpan(year), [year]);
  const ticks = useMemo(() => monthTicks(span), [span]);
  const now = todayOffset(span);
  const month = now ? today().month() : -1;
  const nowStyle = useMemo(() => (now ? { left: now } : undefined), [now]);
  return (
    <nav
      dir="ltr"
      className={classes.strip}
      aria-label={t({
        message: `${year} season timeline`,
        comment: 'Screen-reader label for the About page timeline of the {year} season, one mark per tournament',
      })}
      data-active={active ? true : undefined}
    >
      {ticks.map((m) => (
        <span key={m.month} className={classes.tick} style={m.style} data-now={m.month === month || undefined}>
          <span>{m.label}</span>
        </span>
      ))}
      {tournaments.map((e) => (
        <StripMark
          key={e.code}
          tournament={e}
          span={span}
          active={e === active}
          isSpot={e === focus.spot}
          isFinals={e === focus.finals}
          onActive={onActive}
        />
      ))}
      {nowStyle && (
        <span className={classes.today} style={nowStyle}>
          <span>
            <Trans comment="Marker for today’s date on the About page season timeline">Today</Trans>
          </span>
        </span>
      )}
    </nav>
  );
});
