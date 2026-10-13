import { Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { prefersReducedMotion } from '~/utils/motion';

import classes from './TabBar.module.css';
import utils from '~/styles/utils.module.css';

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
  tip?: string;
  badge?: ReactNode;
}

interface TabBarProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  end?: ReactNode;
  className?: string;
}

interface BarPos {
  x: number;
  w: number;
  value: string;
}

const BAR_EASE = 'cubic-bezier(.6,0,.2,1)';
const BAR_MS = 420;

const placeBar = (nav: HTMLElement, bar: HTMLElement, value: string, prev: BarPos | null): BarPos | null => {
  const btn = [...nav.querySelectorAll<HTMLElement>('[data-tab]')].find((b) => b.dataset.tab === value);
  if (!btn) {
    bar.style.opacity = '0';
    return null;
  }
  const x = btn.offsetLeft;
  const w = btn.offsetWidth;
  bar.style.opacity = '1';
  bar.style.transform = `translateX(${x}px)`;
  bar.style.width = `${w}px`;
  if (prev && prev.value !== value && !prefersReducedMotion()) {
    const left = Math.min(prev.x, x);
    const right = Math.max(prev.x + prev.w, x + w);
    bar.animate(
      [
        { transform: `translateX(${prev.x}px)`, width: `${prev.w}px` },
        { transform: `translateX(${x > prev.x ? prev.x : left}px)`, width: `${right - left}px`, offset: 0.45 },
        { transform: `translateX(${x}px)`, width: `${w}px` },
      ],
      { duration: BAR_MS, easing: BAR_EASE },
    );
  }
  return { x, w, value };
};

const revealTab = (nav: HTMLElement, pos: BarPos | null) => {
  if (!pos) return;
  const { scrollLeft, clientWidth } = nav;
  if (pos.x >= scrollLeft && pos.x + pos.w <= scrollLeft + clientWidth) return;
  nav.scrollTo({ left: pos.x - (clientWidth - pos.w) / 2, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
};

export const TabBar = <T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  end,
  className,
}: TabBarProps<T>) => {
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const posRef = useRef<BarPos | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const bar = barRef.current;
    if (!nav || !bar) return;
    posRef.current = placeBar(nav, bar, value, posRef.current);
    revealTab(nav, posRef.current);
    const replace = () => {
      posRef.current = placeBar(nav, bar, value, null);
    };
    const ro = new ResizeObserver(replace);
    ro.observe(nav);
    nav.querySelectorAll('[data-tab]').forEach((b) => ro.observe(b));
    void document.fonts.ready.then(replace);
    return () => ro.disconnect();
  }, [value]);

  const nav = (
    <nav
      ref={navRef}
      className={clsx(classes.tabs, utils.noScrollbar, !end && className)}
      data-size={size}
      aria-label={ariaLabel}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <Tooltip key={it.value} label={it.tip} disabled={!it.tip}>
            <button
              type="button"
              data-tab={it.value}
              className={classes.tab}
              data-active={active || undefined}
              aria-disabled={it.disabled || undefined}
              aria-current={active ? 'page' : undefined}
              onClick={it.disabled ? undefined : () => onChange(it.value)}
            >
              {it.label}
              {it.badge}
            </button>
          </Tooltip>
        );
      })}
      <span ref={barRef} className={classes.bar} />
    </nav>
  );

  if (!end) return nav;
  return (
    <div className={clsx(classes.root, className)}>
      {nav}
      {end}
    </div>
  );
};
