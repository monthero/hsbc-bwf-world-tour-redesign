import { clsx } from 'clsx';
import { memo, useCallback, useLayoutEffect, useMemo, useRef, type FC, type KeyboardEvent } from 'react';

import { IconBack, IconButton, IconNext, LiveDot, type IconProps } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useScrollEdges } from '~/hooks/useScrollEdges';
import type { TournamentDay } from '~/types';
import { prefersReducedMotion } from '~/utils/motion';

import { daySlots } from '../../utils';
import { RestBreak } from '../RestBreak';
import { centerChild } from './utils';

import classes from './DayPicker.module.css';
import utils from '~/styles/utils.module.css';

const PAGE_RATIO = 0.75;

const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');

const step = (days: readonly TournamentDay[], from: number, dir: number) => {
  for (let i = from + dir; i >= 0 && i < days.length; i += dir) if (!days[i]?.isRest) return i;
  return null;
};

const keyTarget = (key: string, days: readonly TournamentDay[], pos: number) => {
  switch (key) {
    case 'ArrowLeft':
      return step(days, pos, -1) ?? pos;
    case 'ArrowRight':
      return step(days, pos, 1) ?? pos;
    case 'Home':
      return step(days, -1, 1);
    case 'End':
      return step(days, days.length, -1);
    default:
      return null;
  }
};

const dayButton = (el: HTMLElement | null, index: number) =>
  el?.querySelector<HTMLElement>(`[data-day="${index}"]`) ?? null;

const ARROWS = [
  { dir: -1, label: 'Earlier days', Icon: IconBack, className: classes.prev },
  { dir: 1, label: 'Later days', Icon: IconNext, className: classes.next },
] as const;

const Arrow = memo<{
  dir: number;
  label: string;
  Icon: FC<IconProps>;
  className: string | undefined;
  onPage: (dir: number) => void;
}>(({ dir, label, Icon, className, onPage }) => (
  <IconButton
    label={label}
    size="sm"
    variant="filled"
    tabIndex={-1}
    className={clsx(classes.arrow, className)}
    onClick={() => onPage(dir)}
  >
    <Icon size={14} />
  </IconButton>
));

const DayButton = memo<{
  d: TournamentDay;
  selected: boolean;
  short: boolean;
  onChange: (day: number) => void;
}>(({ d, selected, short, onChange }) => {
  return (
    <button
      type="button"
      className={classes.day}
      data-selected={selected || undefined}
      data-past={d.isPast || undefined}
      data-day={d.index}
      aria-pressed={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => onChange(d.index)}
    >
      <span className={classes.weekday}>{short ? d.weekday : d.weekdayLong}</span>
      <span className={classes.date}>
        <span className={classes.num}>{d.dayNum}</span>
        <span className={classes.month}>{short ? d.month : d.monthLong}</span>
      </span>
      {d.isLive && <LiveDot pulse size={5} className={classes.today} />}
    </button>
  );
});

export const DayPicker = memo<{
  days: TournamentDay[];
  day: number;
  onChange: (day: number) => void;
}>(({ days, day, onChange }) => {
  const short = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef(-1);
  const edges = useScrollEdges(ref);
  const pos = useMemo(() => days.findIndex((d) => d.index === day), [days, day]);
  const slots = useMemo(() => daySlots(days), [days]);

  useLayoutEffect(() => {
    const el = ref.current;
    const btn = dayButton(el, day);
    if (!el || !btn) return;
    const animate = shown.current >= 0 && shown.current !== day;
    shown.current = day;
    centerChild(el, btn, animate ? scrollBehavior() : 'auto');
  }, [day]);

  const onPage = useCallback((dir: number) => {
    const el = ref.current;
    el?.scrollBy({ left: dir * el.clientWidth * PAGE_RATIO, behavior: scrollBehavior() });
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const next = keyTarget(e.key, days, pos);
      const target = next === null ? undefined : days[next];
      if (!target || next === null) return;
      e.preventDefault();
      dayButton(e.currentTarget, target.index)?.focus({ preventScroll: true });
      if (next !== pos) onChange(target.index);
    },
    [days, pos, onChange],
  );

  return (
    <div className={classes.root} data-start={edges.start || undefined} data-end={edges.end || undefined}>
      <div
        ref={ref}
        role="toolbar"
        tabIndex={-1}
        aria-label="Tournament days"
        className={clsx(utils.snapRow, utils.noScrollbar, classes.strip)}
        onKeyDown={onKeyDown}
      >
        {slots.map((s) =>
          s.rest ? (
            <RestBreak key={s.key} label={s.rest} active={s.live} className={classes.rest} />
          ) : (
            <DayButton key={s.key} d={s.day} selected={s.day.index === day} short={short} onChange={onChange} />
          ),
        )}
      </div>
      {ARROWS.map((a) => (
        <Arrow key={a.dir} {...a} onPage={onPage} />
      ))}
    </div>
  );
});
