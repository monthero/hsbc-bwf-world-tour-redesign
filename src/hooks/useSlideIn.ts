import { useLayoutEffect, useRef, type RefObject } from 'react';

import { MOTION_EASE } from '~/constants';
import { prefersReducedMotion } from '~/utils/motion';

const DEFAULT_DISTANCE = () => 24;

export const useSlideIn = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  index: number | null,
  { distance = DEFAULT_DISTANCE, duration = 320 }: { distance?: (delta: number) => number; duration?: number } = {},
) => {
  const prev = useRef(index);
  useLayoutEffect(() => {
    const from = prev.current;
    prev.current = index;
    if (index === null || from === null || from === index) return;
    const el = ref.current;
    if (!el?.animate || prefersReducedMotion()) return;
    const delta = index - from;
    el.animate(
      [
        { opacity: 0, transform: `translateX(${Math.sign(delta) * distance(delta)}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration, easing: MOTION_EASE },
    );
  }, [ref, index, distance, duration]);
};
