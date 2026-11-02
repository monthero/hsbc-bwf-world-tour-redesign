import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { inlineSign, scrollBehavior } from '~/utils/scroll';

const SETTLE_MS = 150;
const ALIGNED_PX = 2;

export const snapPages = (el: HTMLElement) => Array.from(el.firstElementChild?.children ?? []);

const offsetsOf = (el: HTMLElement) => {
  const rtl = inlineSign(el) < 0;
  const r = el.getBoundingClientRect();
  const pad = Number.parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0;
  const edge = rtl ? r.right - pad : r.left + pad;
  return snapPages(el).map((c) => {
    const b = c.getBoundingClientRect();
    return rtl ? edge - b.right : b.left - edge;
  });
};

const nearestOf = (offsets: number[]) =>
  offsets.reduce((best, o, i) => (Math.abs(o) < Math.abs(offsets[best] ?? Infinity) ? i : best), 0);

export type PageMove<T extends HTMLElement> = (el: T, from: number | null, to: number) => void;

export const useSnapPager = <T extends HTMLElement>(
  index: number,
  onIndex: (i: number) => void,
  onMove?: PageMove<T>,
) => {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(index);
  const settled = useRef<number | null>(null);
  const target = useRef<number | null>(null);
  const latest = useRef({ index, onIndex, onMove });

  useLayoutEffect(() => {
    latest.current = { index, onIndex, onMove };
  });

  const go = useCallback((i: number, instant: boolean) => {
    const el = ref.current;
    if (!el) return;
    const from = settled.current;
    settled.current = i;
    setShown(i);
    if (from !== i) latest.current.onMove?.(el, from, i);
    const d = offsetsOf(el)[i] ?? 0;
    const behavior = scrollBehavior(instant);
    target.current = d && behavior === 'smooth' ? i : null;
    if (!d) return;
    el.style.scrollSnapType = 'none';
    el.scrollBy({ left: inlineSign(el) * d, behavior });
  }, []);

  useLayoutEffect(() => {
    if (settled.current !== index) go(index, settled.current === null);
  }, [index, go]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let timer = 0;
    const settle = () => {
      window.clearTimeout(timer);
      el.style.scrollSnapType = '';
      const offsets = offsetsOf(el);
      const i = nearestOf(offsets);
      if (Math.abs(offsets[i] ?? 0) > ALIGNED_PX) return;
      target.current = null;
      setShown(i);
      if (i === settled.current) return;
      const { index: current, onIndex: report, onMove: move } = latest.current;
      const from = settled.current;
      settled.current = i;
      if (from !== null) move?.(el, from, i);
      if (i !== current) report(i);
    };
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (target.current === null) setShown(nearestOf(offsetsOf(el)));
      });
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', settle);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', settle);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  const select = useCallback(
    (i: number) => {
      go(i, false);
      latest.current.onIndex(i);
    },
    [go],
  );

  return { ref, shown, select };
};
