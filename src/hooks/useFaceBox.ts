import { useLayoutEffect, useState } from 'react';

const WIDTH_STEP = 120;
const RATIO_STEP = 20;
const MAX_DPR = 2;

export interface FaceBox {
  width: number;
  height: number;
}

const measure = (el: HTMLElement): FaceBox | null => {
  const { width, height } = el.getBoundingClientRect();
  if (!width || !height) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const w = Math.ceil((width * dpr) / WIDTH_STEP) * WIDTH_STEP;
  const ratio = Math.round((height / width) * RATIO_STEP) / RATIO_STEP;
  return { width: w, height: Math.max(1, Math.round(w * ratio)) };
};

const same = (a: FaceBox | null, b: FaceBox | null) => a?.width === b?.width && a?.height === b?.height;

export const useFaceBox = (el: HTMLElement | null, enabled: boolean) => {
  const [box, setBox] = useState<FaceBox | null>(null);
  useLayoutEffect(() => {
    if (!enabled || !el) return;
    const update = () => {
      const next = measure(el);
      setBox((prev) => (same(prev, next) ? prev : next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, enabled]);
  return enabled ? box : null;
};
