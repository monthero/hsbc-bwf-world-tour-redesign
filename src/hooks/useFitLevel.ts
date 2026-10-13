import { useLayoutEffect, useState } from 'react';

const callbacks = new WeakMap<Element, () => void>();
let observer: ResizeObserver | null = null;

const shared = () =>
  (observer ??= new ResizeObserver((entries) => {
    new Set(entries.map((e) => callbacks.get(e.target))).forEach((cb) => cb?.());
  }));

export const useFitLevel = <T extends HTMLElement>() => {
  const [box, setBox] = useState<T | null>(null);
  const [level, setLevel] = useState(0);
  useLayoutEffect(() => {
    if (!box) return;
    const els = [box, ...box.children];
    const measure = () => {
      const room = box.getBoundingClientRect().width;
      const fit = els.slice(1).findIndex((el) => el.getBoundingClientRect().width <= room);
      setLevel(fit < 0 ? els.length - 2 : fit);
    };
    measure();
    const ro = shared();
    els.forEach((el) => {
      callbacks.set(el, measure);
      ro.observe(el);
    });
    return () =>
      els.forEach((el) => {
        callbacks.delete(el);
        ro.unobserve(el);
      });
  }, [box]);
  return [setBox, level] as const;
};
