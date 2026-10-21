import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react';

const HULL_MARGIN = 8;

const inHull = (x: number, y: number, rects: readonly DOMRect[]) =>
  rects.length > 0 &&
  x >= Math.min(...rects.map((r) => r.left)) - HULL_MARGIN &&
  x <= Math.max(...rects.map((r) => r.right)) + HULL_MARGIN &&
  y >= Math.min(...rects.map((r) => r.top)) - HULL_MARGIN &&
  y <= Math.max(...rects.map((r) => r.bottom)) + HULL_MARGIN;

export const useHoverHull = <T extends HTMLElement, D extends HTMLElement>(openDelay: number, closeDelay: number) => {
  const [opened, setOpened] = useState(false);
  const target = useRef<T>(null);
  const dropdown = useRef<D>(null);
  const timer = useRef(0);
  const cancel = useCallback(() => window.clearTimeout(timer.current), []);
  const later = useCallback(
    (open: boolean, ms: number) => {
      cancel();
      timer.current = window.setTimeout(() => setOpened(open), ms);
    },
    [cancel],
  );
  const close = useCallback(() => {
    cancel();
    setOpened(false);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  useEffect(() => {
    if (!opened) return;
    let closing = false;
    const onMove = (e: PointerEvent) => {
      const rects = [target.current, dropdown.current].flatMap((el) => (el ? [el.getBoundingClientRect()] : []));
      if (inHull(e.clientX, e.clientY, rects)) {
        if (closing) cancel();
        closing = false;
        return;
      }
      if (closing) return;
      closing = true;
      later(false, closeDelay);
    };
    const onLeave = () => later(false, closeDelay);
    const root = document.documentElement;
    document.addEventListener('pointermove', onMove);
    root.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      root.removeEventListener('mouseleave', onLeave);
    };
  }, [opened, cancel, later, closeDelay]);

  const onMouseEnter = useCallback(() => {
    if (!opened) later(true, openDelay);
  }, [opened, later, openDelay]);
  const onMouseLeave = useCallback(() => {
    if (!opened) cancel();
  }, [opened, cancel]);
  const onFocus = useCallback(() => later(true, 0), [later]);
  const onBlur = useCallback(
    (e: FocusEvent) => {
      if (!dropdown.current?.contains(e.relatedTarget as Node | null)) later(false, closeDelay);
    },
    [later, closeDelay],
  );

  return { opened, close, target, dropdown, onMouseEnter, onMouseLeave, onFocus, onBlur };
};
