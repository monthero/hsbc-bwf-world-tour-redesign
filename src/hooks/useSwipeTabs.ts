import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

import { inlineSign } from '~/utils/scroll';

const MIN_PX = 64;
const RATIO = 2;
const MAX_MS = 700;
const OWN_PAN = new Set(['none', 'pan-y']);

const handlesInline = (el: Element) => {
  const style = getComputedStyle(el);
  if (OWN_PAN.has(style.touchAction)) return true;
  if (el instanceof HTMLInputElement && el.type === 'range') return true;
  return (style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth;
};

const swipeBlocked = (target: EventTarget | null, root: HTMLElement) => {
  let el = target instanceof Element ? target : null;
  while (el && el !== root) {
    if (handlesInline(el)) return true;
    el = el.parentElement;
  }
  return false;
};

export const useSwipeTabs = <T extends string>(
  ref: RefObject<HTMLElement | null>,
  tabs: readonly T[],
  current: T,
  onTab: (tab: T) => void,
  ready: boolean,
) => {
  const latest = useRef({ tabs, current, onTab });

  useLayoutEffect(() => {
    latest.current = { tabs, current, onTab };
  });

  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    let start: { x: number; y: number; at: number } | null = null;
    const onStart = (e: TouchEvent) => {
      const p = e.touches[0];
      start =
        e.touches.length === 1 && p && !swipeBlocked(e.target, el)
          ? { x: p.clientX, y: p.clientY, at: e.timeStamp }
          : null;
    };
    const onEnd = (e: TouchEvent) => {
      const p = e.changedTouches[0];
      const from = start;
      start = null;
      if (!from || !p || e.timeStamp - from.at > MAX_MS) return;
      const dx = p.clientX - from.x;
      const dy = p.clientY - from.y;
      if (Math.abs(dx) < MIN_PX || Math.abs(dx) < RATIO * Math.abs(dy)) return;
      const { tabs: list, current: tab, onTab: go } = latest.current;
      const at = list.indexOf(tab);
      const to = at + (dx * inlineSign(el) < 0 ? 1 : -1);
      if (at < 0 || to < 0) return;
      const next = list.at(to);
      if (next) go(next);
    };
    const onCancel = () => {
      start = null;
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
  }, [ref, ready]);
};
