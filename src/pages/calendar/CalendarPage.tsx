import { useLingui } from '@lingui/react';
import { VisuallyHidden } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FC } from 'react';

import { EmptyState, FloatingPill, IconCollapse, IconExpand, LiveDot } from '~/components/ui';
import { SEASON_YEAR } from '~/constants';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useScrolledPast } from '~/hooks/useScrolledPast';
import { useTournaments } from '~/hooks/useTournaments';
import type { Level, Tournament } from '~/types';
import { toggleItem } from '~/utils/filter';
import { headerOffset } from '~/utils/layout';
import { calendarMeta } from '~/utils/meta';
import { STAY } from '~/utils/navigation';
import { summarize } from '~/utils/season';
import { isHeld } from '~/utils/tournaments';

import { CompactHeader } from './components/CompactHeader';
import { FilterBar } from './components/FilterBar';
import { FinaleSection } from './components/FinaleSection';
import { Hero } from './components/Hero';
import { MonthSection } from './components/MonthSection';
import { AUTO_SCROLL_DELAYS, COMPACT_HEIGHT, USER_SCROLL_EVENTS } from './constants';
import type { JumpDirection, StatusFilter } from './types';
import { buildMonths, canFilterStatus, filterTournaments, finalsReached, isFiltered } from './utils';

import classes from './CalendarPage.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/calendar');

const SENTINEL_OPTS = { offset: 0 };

let autoScrolled = false;

export const CalendarPage: FC = () => {
  const year = route.useSearch({ select: (s) => s.year ?? SEASON_YEAR });
  const { data } = useTournaments(year);
  const { _ } = useLingui();
  const meta = useMemo(() => calendarMeta(_, year), [_, year]);
  useDocumentMeta(meta);
  return data ? <Calendar key={year} year={year} tournaments={data} /> : null;
};

const Calendar: FC<{ year: number; tournaments: Tournament[] }> = ({ year, tournaments }) => {
  const isMobile = useIsMobile();
  const { levels, status: picked = 'all' } = route.useSearch();
  const navigate = route.useNavigate();

  const season = useMemo(() => summarize(tournaments, year), [tournaments, year]);
  const held = useMemo(() => tournaments.filter(isHeld), [tournaments]);
  const showStatus = canFilterStatus(season);
  const status = showStatus ? picked : 'all';
  const list = useMemo(() => filterTournaments(tournaments, levels, status), [tournaments, levels, status]);
  const filtered = isFiltered(levels, status);
  const months = useMemo(
    () => buildMonths(tournaments, list, filtered, season.phase),
    [tournaments, list, filtered, season.phase],
  );
  const { finals, target, live, next } = season;
  const showFinals = !!finals && list.includes(finals);

  const [sentinelRef, compact] = useScrolledPast<HTMLDivElement>(SENTINEL_OPTS);
  const [jump, setJump] = useState<JumpDirection>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const monthEls = useRef(new Map<number, HTMLElement>());
  const compactH = isMobile ? COMPACT_HEIGHT.mobile : COMPACT_HEIGHT.desktop;
  const pageStyle = useMemo(() => ({ '--cal-compact-h': `${compactH}px` }) as CSSProperties, [compactH]);

  const setTarget = useCallback((el: HTMLElement | null) => {
    targetRef.current = el;
  }, []);

  const registerMonth = useCallback((month: number, el: HTMLElement | null) => {
    if (el) monthEls.current.set(month, el);
    else monthEls.current.delete(month);
  }, []);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const el = targetRef.current;
      const bar = stickyRef.current;
      if (!el || !bar) return setJump(null);
      const r = el.getBoundingClientRect();
      if (r.bottom < bar.getBoundingClientRect().bottom) return setJump('up');
      setJump(r.top > window.innerHeight ? 'down' : null);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(onScroll);
    if (mainRef.current) ro.observe(mainRef.current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scrollToTarget = useCallback(
    (smooth: boolean) => {
      const el = target && monthEls.current.get(target.month);
      if (!el) return;
      const offset = headerOffset() + compactH + (stickyRef.current?.offsetHeight ?? 0);
      const top = el.getBoundingClientRect().top + window.scrollY - offset + 1;
      window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
    },
    [target, compactH],
  );

  useEffect(() => {
    if (autoScrolled || !target) return;
    let moved = false;
    const stop = () => {
      moved = true;
    };
    USER_SCROLL_EVENTS.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    const timers = AUTO_SCROLL_DELAYS.map((ms) =>
      window.setTimeout(() => {
        if (moved) return;
        autoScrolled = true;
        scrollToTarget(false);
      }, ms),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      USER_SCROLL_EVENTS.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [target, scrollToTarget]);

  const onJump = useCallback(() => scrollToTarget(true), [scrollToTarget]);

  const onLevel = useCallback(
    (level: Level) =>
      void navigate({
        search: (s) => ({ ...s, levels: toggleItem(s.levels, level) }),
        ...STAY,
      }),
    [navigate],
  );

  const onStatus = useCallback(
    (v: StatusFilter | null) =>
      void navigate({
        search: (s) => ({ ...s, status: v && v !== 'all' ? v : undefined }),
        ...STAY,
      }),
    [navigate],
  );

  const onYear = useCallback(
    (y: number) => void navigate({ search: (s) => ({ levels: s.levels, year: y === SEASON_YEAR ? undefined : y }) }),
    [navigate],
  );

  const jumpPrefix = live ? 'Live now' : 'Up next';

  return (
    <div className={classes.page} style={pageStyle}>
      <CompactHeader visible={compact} tournaments={held} season={season} isMobile={isMobile} />
      <Hero tournaments={held} season={season} isMobile={isMobile} onYear={onYear} />
      <div ref={sentinelRef} />
      <FilterBar
        ref={stickyRef}
        compact={compact}
        levels={levels}
        status={status}
        showStatus={showStatus}
        onLevel={onLevel}
        onStatus={onStatus}
        jumpLabel={target ? jumpPrefix : null}
        onJump={onJump}
        isMobile={isMobile}
      />
      <main ref={mainRef} className={clsx(utils.container, classes.main)}>
        {months.map((g, i) => (
          <MonthSection
            key={g.month}
            group={g}
            first={i === 0}
            isMobile={isMobile}
            nextCode={next?.code}
            targetCode={target?.code}
            anchorRef={setTarget}
            register={registerMonth}
          />
        ))}
        {showFinals && (
          <FinaleSection
            tournament={finals}
            reached={finalsReached(finals, season.phase)}
            isMobile={isMobile}
            anchorRef={finals === target ? setTarget : undefined}
            register={registerMonth}
          />
        )}
        {!months.length && !showFinals && <EmptyState>No events match these filters</EmptyState>}
        {season.phase !== 'past' && <p className={classes.note}>Dates and prize money subject to change.</p>}
      </main>
      {target && (
        <FloatingPill visible={jump !== null} onClick={onJump}>
          {live ? (
            <>
              <LiveDot pulse />
              <VisuallyHidden>Live now: </VisuallyHidden>
            </>
          ) : (
            `${jumpPrefix} · `
          )}
          {target.name}
          {jump === 'up' ? <IconCollapse size={15} /> : <IconExpand size={15} />}
        </FloatingPill>
      )}
    </div>
  );
};
