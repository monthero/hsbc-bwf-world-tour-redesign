import { useCallback, useState, type RefCallback } from 'react';

export const useInView = <T extends Element>() => {
  const [inView, setInView] = useState(false);
  const ref = useCallback<RefCallback<T>>((el) => {
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
};
