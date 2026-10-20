import { useLayoutEffect, useState } from 'react';

const callbacks = new WeakMap<Element, () => void>();
let observer: ResizeObserver | null = null;

const SUBPIXEL = 0.5;

const shared = () =>
  (observer ??= new ResizeObserver((entries) => {
    new Set(entries.map((e) => callbacks.get(e.target))).forEach((cb) => cb?.());
  }));

const trailSpace = (trail: HTMLElement | null | undefined) => {
  const width = trail?.getBoundingClientRect().width ?? 0;
  const line = trail?.parentElement;
  if (!width || !line) return 0;
  return width + (Number.parseFloat(getComputedStyle(line).columnGap) || 0);
};

export const useFitLevel = <T extends HTMLElement>(trail?: HTMLElement | null) => {
  const [box, setBox] = useState<T | null>(null);
  const [level, setLevel] = useState(0);
  const [reserve, setReserve] = useState(0);
  useLayoutEffect(() => {
    if (!box) return;
    const forms = [...box.children];
    const els = trail ? [box, trail, ...forms] : [box, ...forms];
    const measure = () => {
      const space = trailSpace(trail);
      const room = box.getBoundingClientRect().width - space + SUBPIXEL;
      const fit = forms.findIndex((el) => el.getBoundingClientRect().width <= room);
      setReserve(space);
      setLevel(fit < 0 ? forms.length - 1 : fit);
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
  }, [box, trail]);
  return [setBox, level, reserve] as const;
};
