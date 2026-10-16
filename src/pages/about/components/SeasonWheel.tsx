import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type MouseEvent } from 'react';

import { LEVEL_VARS } from '~/constants';
import type { Tournament } from '~/types';
import { date, formatWall } from '~/utils/dates';
import { centerChild } from '~/utils/scroll';

import { SHORT_MONTH } from '../constants';
import type { OnActive, SeasonFocus } from '../types';
import { SpotHalo } from './SpotHalo';

import classes from './SeasonWheel.module.css';
import utils from '~/styles/utils.module.css';

const WheelItem = memo<{
  tournament: Tournament;
  month: string | null;
  selected: boolean;
  isSpot: boolean;
  isToday: boolean;
  onPick: (e: MouseEvent<HTMLButtonElement>) => void;
}>(({ tournament: t, month, selected, isSpot, isToday, onPick }) => (
  <button
    type="button"
    className={classes.item}
    style={LEVEL_VARS[t.level]}
    data-code={t.code}
    data-status={t.status}
    data-spot={isSpot || undefined}
    data-today={isToday || undefined}
    aria-pressed={selected}
    aria-label={`${t.name}, ${t.dates}`}
    onClick={onPick}
  >
    {month && <span className={classes.month}>{month}</span>}
    {isSpot && <SpotHalo live={t.status === 'live'} solid className={classes.spot} />}
    <i />
    <span className={utils.num}>{date(t.start).date()}</span>
  </button>
));

export const SeasonWheel = memo<{
  tournaments: Tournament[];
  focus: SeasonFocus;
  selected: Tournament | undefined;
  onSelect: OnActive;
}>(({ tournaments, focus, selected, onSelect }) => {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef(selected?.code);
  useLayoutEffect(() => {
    current.current = selected?.code;
  }, [selected]);
  const items = useMemo(
    () =>
      tournaments.map((t, i) => {
        const m = date(t.start).month();
        const prev = tournaments[i - 1];
        return { t, month: !prev || date(prev.start).month() !== m ? formatWall(date(t.start), SHORT_MONTH) : null };
      }),
    [tournaments],
  );
  const todayIndex = useMemo(
    () => tournaments.findIndex((t) => t.status === 'live' || t.status === 'up'),
    [tournaments],
  );

  useLayoutEffect(() => {
    const wheel = ref.current;
    if (!wheel || !items.length) return;
    const el = wheel.querySelector<HTMLElement>(`[data-code="${current.current}"]`);
    if (el) centerChild(wheel, el);
  }, [items]);

  useEffect(() => {
    const wheel = ref.current;
    if (!wheel) return;
    let raf = 0;
    const pick = () => {
      const mid = wheel.scrollLeft + wheel.clientWidth / 2;
      let best: HTMLElement | null = null;
      let dist = Infinity;
      for (const el of wheel.children as HTMLCollectionOf<HTMLElement>) {
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (d < dist) {
          dist = d;
          best = el;
        }
      }
      const code = best?.dataset.code;
      if (code && code !== current.current) onSelect(code);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pick);
    };
    wheel.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      wheel.removeEventListener('scroll', onScroll);
    };
  }, [onSelect]);

  const onPick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const wheel = ref.current;
    if (wheel) centerChild(wheel, e.currentTarget, 'smooth');
  }, []);

  return (
    <div className={classes.wrap} dir="ltr">
      <div ref={ref} className={classes.wheel}>
        {items.map(({ t, month }, i) => (
          <WheelItem
            key={t.code}
            tournament={t}
            month={month}
            selected={t === selected}
            isSpot={t === focus.spot}
            isToday={i === todayIndex}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
});
