import type { PanZoomView } from '~/hooks/usePanZoom';
import { localAsset } from '~/utils/images';

import { LAND_BORDER_PX, LAND_FINE_PPU, LAND_MAX_DPR, LAND_OVERSCAN, MAP_SIZE } from './constants';
import { LAND_DETAILS, type LandDetail } from './landLevels';

export type { LandDetail };

export interface LandShapes {
  scale: number;
  land: Path2D;
  borders: Path2D;
}

interface LandAsset {
  quantum: number;
  land: string;
  borders: string;
}

interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const loading = new Map<LandDetail, Promise<LandShapes | null>>();

export const loadLand = (detail: LandDetail) => {
  const known = loading.get(detail);
  if (known !== undefined) return known;
  const next = fetch(localAsset(`/assets/${LAND_DETAILS[detail]}`))
    .then((r) => r.json() as Promise<LandAsset>)
    .then((a) => ({ scale: 1 / a.quantum, land: new Path2D(a.land), borders: new Path2D(a.borders) }))
    .catch(() => {
      loading.delete(detail);
      return null;
    });
  loading.set(detail, next);
  return next;
};

export interface DrawnLand {
  rect: MapRect;
  k: number;
  px: number;
  look: string;
}

const EPSILON = 1e-6;

const pxPerUnit = (v: PanZoomView, px: number) => (px * v.k) / MAP_SIZE.w;

export const landDetail = (v: PanZoomView, px: number): LandDetail =>
  pxPerUnit(v, px) >= LAND_FINE_PPU ? 'fine' : 'coarse';

const viewRect = (v: PanZoomView, margin: number): MapRect => {
  const vw = MAP_SIZE.w / v.k;
  const vh = MAP_SIZE.h / v.k;
  const x0 = Math.max(0, v.x - vw * (0.5 + margin));
  const y0 = Math.max(0, v.y - vh * (0.5 + margin));
  const x1 = Math.min(MAP_SIZE.w, v.x + vw * (0.5 + margin));
  const y1 = Math.min(MAP_SIZE.h, v.y + vh * (0.5 + margin));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

export const landRect = (v: PanZoomView, px: number, look: string, prev: DrawnLand | null) => {
  if (!prev || prev.k !== v.k || prev.px !== px || prev.look !== look) return viewRect(v, LAND_OVERSCAN);
  const need = viewRect(v, LAND_OVERSCAN / 2);
  const { rect } = prev;
  const inside =
    need.x >= rect.x - EPSILON &&
    need.y >= rect.y - EPSILON &&
    need.x + need.w <= rect.x + rect.w + EPSILON &&
    need.y + need.h <= rect.y + rect.h + EPSILON;
  return inside ? rect : viewRect(v, LAND_OVERSCAN);
};

export const placeRect = (el: HTMLElement | SVGElement, r: MapRect, v: PanZoomView, px: number) => {
  const ppu = pxPerUnit(v, px);
  el.style.insetInlineStart = `${(r.x - (v.x - MAP_SIZE.w / v.k / 2)) * ppu}px`;
  el.style.insetBlockStart = `${(r.y - (v.y - MAP_SIZE.h / v.k / 2)) * ppu}px`;
  el.style.width = `${r.w * ppu}px`;
  el.style.height = `${r.h * ppu}px`;
};

export const drawLand = (
  canvas: HTMLCanvasElement,
  shapes: LandShapes | undefined,
  v: PanZoomView,
  px: number,
  r: MapRect,
) => {
  const dpr = Math.min(window.devicePixelRatio || 1, LAND_MAX_DPR);
  const scale = pxPerUnit(v, px) * dpr;
  canvas.width = Math.max(1, Math.round(r.w * scale));
  canvas.height = Math.max(1, Math.round(r.h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx || !shapes) return;
  const unit = scale * shapes.scale;
  const style = getComputedStyle(canvas);
  ctx.setTransform(unit, 0, 0, unit, -r.x * scale, -r.y * scale);
  ctx.fillStyle = style.color;
  ctx.fill(shapes.land);
  ctx.strokeStyle = style.borderColor;
  ctx.lineWidth = (LAND_BORDER_PX * dpr) / unit;
  ctx.lineJoin = 'round';
  ctx.stroke(shapes.borders);
};
