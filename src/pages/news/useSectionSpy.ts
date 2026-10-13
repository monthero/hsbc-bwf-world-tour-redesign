import { useCallback, useEffect, useRef, useState } from 'react';

import { headerOffset } from '~/utils/layout';
import { prefersReducedMotion } from '~/utils/motion';

import type { RegisterSection } from './types';

export const useSectionSpy = (gap: number, barRef: { current: HTMLElement | null }) => {
  const els = useRef(new Map<string, HTMLElement>());
  const [active, setActive] = useState<string | null>(null);

  const register = useCallback<RegisterSection>((id, el) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  }, []);

  const offset = useCallback(() => headerOffset() + (barRef.current?.offsetHeight ?? 0) + gap, [barRef, gap]);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const line = offset() + 1;
      let best: { id: string; top: number } | null = null;
      for (const [id, el] of els.current) {
        const top = el.getBoundingClientRect().top;
        if (top <= line && (!best || top > best.top)) best = { id, top };
      }
      setActive(best?.id ?? null);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [offset]);

  const jump = useCallback(
    (id: string) => {
      const el = els.current.get(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - offset();
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    },
    [offset],
  );

  return { active, register, jump };
};
