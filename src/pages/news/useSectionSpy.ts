import { useCallback, useEffect, useRef, useState } from 'react';

import { headerOffset } from '~/utils/layout';
import { prefersReducedMotion } from '~/utils/motion';

import type { Probe, RegisterSection } from './types';

export const scrollBehavior = (instant?: boolean): ScrollBehavior =>
  instant || prefersReducedMotion() ? 'auto' : 'smooth';

export const useSectionSpy = (
  gap: number,
  barRef: { current: HTMLElement | null },
  probeRef: { current: Probe | null },
) => {
  const els = useRef(new Map<string, HTMLElement>());
  const [active, setActive] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const register = useCallback<RegisterSection>((id, el) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(() => setOffset(headerOffset() + (barRef.current?.offsetHeight ?? 0) + gap));
    ro.observe(document.documentElement);
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [barRef, gap]);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const line = offset + 1;
      const probed = probeRef.current?.(window.scrollY + line);
      if (probed !== undefined) return setActive(probed);
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
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [offset, probeRef]);

  const jump = useCallback(
    (id: string) => {
      const el = els.current.get(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior() });
    },
    [offset],
  );

  return { active, register, jump, offset };
};
