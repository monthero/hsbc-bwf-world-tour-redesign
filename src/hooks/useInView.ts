import { useCallback, useState, type RefCallback } from 'react';

interface InViewOptions {
  rootMargin?: string;
  once?: boolean;
}

export const useInView = <T extends Element>({ rootMargin, once = false }: InViewOptions = {}) => {
  const [inView, setInView] = useState(false);
  const ref = useCallback<RefCallback<T>>(
    (el) => {
      if (!el) return;
      const io = new IntersectionObserver(
        ([e]) => {
          const hit = !!e?.isIntersecting;
          if (once && !hit) return;
          setInView(hit);
          if (once) io.disconnect();
        },
        { rootMargin },
      );
      io.observe(el);
      return () => io.disconnect();
    },
    [rootMargin, once],
  );
  return [ref, inView] as const;
};
