import { useClickOutside } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';

import type { Tournament } from '~/types';
import { tournamentParams } from '~/utils/tournaments';

import { EventDetails } from './EventDetails';
import { SeasonCells } from './SeasonCells';

import classes from './SeasonBar.module.css';
import utils from '~/styles/utils.module.css';

const CLOSE_DELAY = 180;

export const SeasonBar = memo<{
  tournaments: Tournament[];
  size: 'sm' | 'md';
  isMobile: boolean;
  label?: string;
  className?: string;
}>(({ tournaments, size, isMobile, label, className }) => {
  const navigate = useNavigate();
  const [pop, setPop] = useState(-1);
  const popRef = useRef(-1);
  const closeTimer = useRef(0);
  const touch = useRef(false);
  const shown = useDeferredValue(pop);

  const select = useCallback((i: number) => {
    window.clearTimeout(closeTimer.current);
    popRef.current = i;
    setPop(i);
  }, []);

  const close = useCallback(() => select(-1), [select]);

  const ref = useClickOutside<HTMLDivElement>(close);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const onHover = useCallback(
    (i: number, pointerType: string) => {
      touch.current = pointerType !== 'mouse';
      if (!touch.current) select(i);
    },
    [select],
  );

  const onActivate = useCallback(
    (i: number) => {
      const t = tournaments[i];
      if (!t) return;
      if ((isMobile || touch.current) && popRef.current !== i) return select(i);
      void navigate({ to: '/world-tour/$year/$slug', params: tournamentParams(t) });
    },
    [tournaments, isMobile, navigate, select],
  );

  const onPointerLeave = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(close, CLOSE_DELAY);
    },
    [close],
  );

  const selected = tournaments[shown];
  const p = Math.round((Math.max(0, pop) / Math.max(1, tournaments.length - 1)) * 100);

  return (
    <div ref={ref} className={clsx(classes.bar, className)} data-size={size} onPointerLeave={onPointerLeave}>
      <SeasonCells
        tournaments={tournaments}
        size={size}
        selected={pop}
        label={label}
        onHover={onHover}
        onActivate={onActivate}
      />
      {pop >= 0 && selected && (
        <div className={clsx(utils.popover, classes.pop)} style={{ '--p': `${p}%` } as CSSProperties}>
          <EventDetails tournament={selected} />
        </div>
      )}
    </div>
  );
});
