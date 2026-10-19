import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { prefersReducedMotion } from '~/utils/motion';

export interface PanZoomPoint {
  x: number;
  y: number;
}

export interface PanZoomView extends PanZoomPoint {
  k: number;
}

interface PanZoomOptions {
  width: number;
  height: number;
  maxZoom: number;
  home: PanZoomView;
  onSettle: (view: PanZoomView, frameWidth: number) => void;
  onBlockedWheel?: () => void;
}

interface Gesture extends PanZoomPoint {
  d: number;
  view: PanZoomView;
  rect: DOMRect;
}

const DRAG_SLOP = 4;
const FLY_MS = 450;
const WHEEL_IDLE_MS = 160;
const WHEEL_PIXEL = 0.002;
const WHEEL_UNIT = [WHEEL_PIXEL, 0.05, 1];
const PINCH_WHEEL = 10;
const ZOOMED = 1.02;
const SAME_XY = 0.01;
const SAME_K = 0.001;
const NO_PAN = '[data-no-pan]';
const PASSIVE = { passive: true } as const;

const clampTo = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const ease = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (2 - 2 * p) ** 3 / 2);

const sameView = (a: PanZoomView, b: PanZoomView) =>
  Math.abs(a.x - b.x) < SAME_XY && Math.abs(a.y - b.y) < SAME_XY && Math.abs(a.k - b.k) < SAME_K;

const spread = (points: Map<number, PanZoomPoint>) => {
  const [a, b] = points.values();
  if (!a) return { x: 0, y: 0, d: 0 };
  if (!b) return { x: a.x, y: a.y, d: 0 };
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
};

export const usePanZoom = <T extends HTMLElement, L extends HTMLElement = HTMLDivElement>({
  width,
  height,
  maxZoom,
  home,
  onSettle,
  onBlockedWheel,
}: PanZoomOptions) => {
  const ref = useRef<T>(null);
  const layerRef = useRef<L>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const clamp = useCallback(
    (v: PanZoomView): PanZoomView => {
      const k = clampTo(v.k, 1, maxZoom);
      const hw = width / k / 2;
      const hh = height / k / 2;
      return { k, x: clampTo(v.x, hw, width - hw), y: clampTo(v.y, hh, height - hh) };
    },
    [width, height, maxZoom],
  );
  const start = useMemo(() => clamp(home), [clamp, home]);
  const world = useMemo(() => clamp({ x: width / 2, y: height / 2, k: 1 }), [clamp, width, height]);
  const [view, setView] = useState(start);
  const [frameWidth, setFrameWidth] = useState(0);
  const live = useRef(start);
  const rendered = useRef(start);
  const goal = useRef(start);
  const pixels = useRef(0);
  const moving = useRef(false);
  const touched = useRef(false);
  const frame = useRef(0);
  const flight = useRef(0);
  const latest = useRef({ onSettle, onBlockedWheel, start });

  useLayoutEffect(() => {
    latest.current = { onSettle, onBlockedWheel, start };
  });

  const paint = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const c = rendered.current;
    const v = live.current;
    const r = v.k / c.k;
    const ppu = (pixels.current * v.k) / width;
    const tx = (c.x - width / c.k / 2 - (v.x - width / v.k / 2)) * ppu;
    const ty = (c.y - height / c.k / 2 - (v.y - height / v.k / 2)) * ppu;
    if (!moving.current) {
      moving.current = true;
      layer.style.transformOrigin = '0 0';
      layer.style.willChange = 'transform';
      if (ref.current) ref.current.dataset.moving = '';
    }
    layer.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${r})`;
    counterRef.current?.style.setProperty('--pz-counter', `${1 / r}`);
  }, [width, height]);

  const settle = useCallback(
    (v: PanZoomView) => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      live.current = v;
      rendered.current = v;
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--view-x', `${(v.x - width / v.k / 2) / width}`);
      el.style.setProperty('--view-y', `${(v.y - height / v.k / 2) / height}`);
      el.style.setProperty('--view-k', `${v.k}`);
      el.style.touchAction = v.k > latest.current.start.k * ZOOMED ? 'none' : '';
      latest.current.onSettle(v, pixels.current);
      const layer = layerRef.current;
      if (layer && moving.current) {
        layer.style.transform = '';
        layer.style.willChange = '';
        counterRef.current?.style.removeProperty('--pz-counter');
        delete el.dataset.moving;
      }
      moving.current = false;
      setView((prev) => (sameView(prev, v) ? prev : v));
    },
    [width, height],
  );

  const schedule = useCallback(
    (v: PanZoomView) => {
      live.current = v;
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        paint();
      });
    },
    [paint],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(flight.current);
    flight.current = 0;
  }, []);

  const flyTo = useCallback(
    (target: PanZoomView) => {
      stop();
      const to = clamp(target);
      const from = live.current;
      goal.current = to;
      if (prefersReducedMotion() || sameView(from, to)) {
        settle(to);
        return;
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / FLY_MS);
        if (p >= 1) {
          flight.current = 0;
          settle(to);
          return;
        }
        const e = ease(p);
        live.current = clamp({
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          k: from.k * (to.k / from.k) ** e,
        });
        paint();
        flight.current = requestAnimationFrame(step);
      };
      flight.current = requestAnimationFrame(step);
    },
    [clamp, paint, settle, stop],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      touched.current = true;
      const base = flight.current ? goal.current : live.current;
      flyTo({ ...base, k: base.k * factor });
    },
    [flyTo],
  );

  const reset = useCallback(() => {
    touched.current = true;
    flyTo(world);
  }, [flyTo, world]);

  const goHome = useCallback(() => {
    touched.current = false;
    flyTo(latest.current.start);
  }, [flyTo]);

  const reveal = useCallback(
    (p: PanZoomPoint, inset: number) => {
      const base = flight.current ? goal.current : live.current;
      const hw = (width / base.k / 2) * (1 - 2 * inset);
      const hh = (height / base.k / 2) * (1 - 2 * inset);
      if (Math.abs(p.x - base.x) < hw && Math.abs(p.y - base.y) < hh) return;
      touched.current = true;
      flyTo({ x: p.x, y: p.y, k: base.k });
    },
    [flyTo, width, height],
  );

  const refresh = useCallback(() => latest.current.onSettle(rendered.current, pixels.current), []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      pixels.current = el.clientWidth;
      setFrameWidth(el.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === pixels.current) return;
      measure();
      if (!moving.current) settle(live.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [settle]);

  useLayoutEffect(() => {
    if (touched.current) return;
    stop();
    goal.current = start;
    settle(start);
  }, [start, settle, stop]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const points = new Map<number, PanZoomPoint>();
    let gesture: Gesture | null = null;
    let dragging = false;
    let swallow = false;
    let idle = 0;
    let wheelRect: DOMRect | null = null;

    const toContent = (rect: DOMRect, v: PanZoomView, sx: number, sy: number) => {
      const ppu = (rect.width * v.k) / width;
      return { x: v.x + (sx - rect.left - rect.width / 2) / ppu, y: v.y + (sy - rect.top - rect.height / 2) / ppu };
    };
    const centerAt = (rect: DOMRect, k: number, p: PanZoomPoint, sx: number, sy: number) => {
      const ppu = (rect.width * k) / width;
      return clamp({
        k,
        x: p.x - (sx - rect.left - rect.width / 2) / ppu,
        y: p.y - (sy - rect.top - rect.height / 2) / ppu,
      });
    };
    const rebase = () => {
      gesture = { ...spread(points), view: live.current, rect: el.getBoundingClientRect() };
    };
    const end = (e: PointerEvent) => {
      if (!points.delete(e.pointerId)) return;
      if (points.size) {
        rebase();
        return;
      }
      gesture = null;
      if (!dragging) return;
      dragging = false;
      swallow = e.type === 'pointerup' && e.pointerType !== 'touch';
      delete el.dataset.panning;
      settle(live.current);
    };
    const down = (e: PointerEvent) => {
      swallow = false;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest(NO_PAN)) return;
      stop();
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      rebase();
    };
    const move = (e: PointerEvent) => {
      if (!points.has(e.pointerId) || !gesture) return;
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) {
        end(e);
        return;
      }
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const s = spread(points);
      if (!dragging) {
        if (points.size < 2 && Math.hypot(s.x - gesture.x, s.y - gesture.y) < DRAG_SLOP) return;
        dragging = true;
        touched.current = true;
        el.dataset.panning = '';
        for (const id of points.keys()) el.setPointerCapture(id);
      }
      const { view: v, rect } = gesture;
      const k = clampTo(gesture.d && s.d ? v.k * (s.d / gesture.d) : v.k, 1, maxZoom);
      const lockY = e.pointerType === 'touch' && points.size < 2 && el.style.touchAction !== 'none';
      schedule(centerAt(rect, k, toContent(rect, v, gesture.x, gesture.y), s.x, lockY ? gesture.y : s.y));
    };
    const click = (e: MouseEvent) => {
      if (!swallow) return;
      swallow = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const wheelEnd = () => {
      wheelRect = null;
      settle(live.current);
    };
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !el.contains(document.activeElement)) {
        latest.current.onBlockedWheel?.();
        return;
      }
      e.preventDefault();
      stop();
      touched.current = true;
      wheelRect ??= el.getBoundingClientRect();
      const unit = (WHEEL_UNIT[e.deltaMode] ?? WHEEL_PIXEL) * (e.ctrlKey ? PINCH_WHEEL : 1);
      const v = live.current;
      const k = clampTo(v.k * 2 ** clampTo(-e.deltaY * unit, -1, 1), 1, maxZoom);
      schedule(centerAt(wheelRect, k, toContent(wheelRect, v, e.clientX, e.clientY), e.clientX, e.clientY));
      window.clearTimeout(idle);
      idle = window.setTimeout(wheelEnd, WHEEL_IDLE_MS);
    };
    const noDrag = (e: Event) => e.preventDefault();

    el.addEventListener('pointerdown', down, PASSIVE);
    el.addEventListener('pointermove', move, PASSIVE);
    el.addEventListener('pointerup', end, PASSIVE);
    el.addEventListener('pointercancel', end, PASSIVE);
    el.addEventListener('click', click, true);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('dragstart', noDrag);
    return () => {
      window.clearTimeout(idle);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      el.removeEventListener('click', click, true);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('dragstart', noDrag);
    };
  }, [clamp, maxZoom, schedule, settle, stop, width]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      cancelAnimationFrame(flight.current);
    },
    [],
  );

  return {
    ref,
    layerRef,
    counterRef,
    view,
    frameWidth,
    atHome: sameView(view, start),
    atWorld: sameView(view, world),
    canZoomIn: view.k < maxZoom - SAME_K,
    canZoomOut: view.k > 1 + SAME_K,
    zoomBy,
    reset,
    goHome,
    reveal,
    refresh,
  };
};
