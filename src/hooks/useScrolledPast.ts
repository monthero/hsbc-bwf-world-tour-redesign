import { useCallback, useState, type RefCallback } from 'react';

import { headerOffset, tabbarHeight } from '~/utils/layout';

export const useScrolledPast = <T extends Element>({ offset }: { offset?: number } = {}) => {
  const [past, setPast] = useState(false);
  const ref = useCallback<RefCallback<T>>(
    (el) => {
      if (!el) return;
      const top = headerOffset() + (offset ?? tabbarHeight(el));
      const io = new IntersectionObserver(
        ([e]) => {
          if (e) setPast(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? top));
        },
        { rootMargin: `-${top}px 0px 0px 0px` },
      );
      io.observe(el);
      return () => io.disconnect();
    },
    [offset],
  );
  return [ref, past] as const;
};
