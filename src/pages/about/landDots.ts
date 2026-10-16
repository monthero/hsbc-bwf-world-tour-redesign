import type { PanZoomView } from '~/hooks/usePanZoom';

import { LAND_CELL_PX, LAND_MAX_DPR, LAND_OVERSCAN, LAND_TILE_PX, MAP_ASSET, MAP_SIZE } from './constants';
import { LAND_DOT, LAND_LEVELS } from './mapLevels';

export type LandGrids = Int32Array[];

interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const LEVEL_PATH = /<path id="l(\d+)"[^>]* d="([^"]*)"/g;
const COMMAND = /([Mmh])(-?\d+)(?: (-?\d+))?/g;

const parseRuns = (d: string) => {
  const runs: number[] = [];
  let x = 0;
  let y = 0;
  for (const [, cmd, a = '0', b = '0'] of d.matchAll(COMMAND)) {
    const p = Number(a);
    if (cmd === 'h') {
      runs.push(x, y, p);
      x += p;
    } else if (cmd === 'm') {
      x += p;
      y += Number(b);
    } else {
      x = p;
      y = Number(b);
    }
  }
  return Int32Array.from(runs);
};

let grids: Promise<LandGrids> | null = null;

export const loadLand = () =>
  (grids ??= fetch(MAP_ASSET)
    .then((r) => r.text())
    .then((svg) =>
      [...svg.matchAll(LEVEL_PATH)].sort((a, b) => Number(a[1]) - Number(b[1])).map((m) => parseRuns(m[2] ?? '')),
    )
    .catch(() => {
      grids = null;
      return [];
    }));

export interface DrawnLand {
  rect: MapRect;
  k: number;
  px: number;
  look: string;
}

const EPSILON = 1e-6;

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
  const ppu = (px * v.k) / MAP_SIZE.w;
  el.style.insetInlineStart = `${(r.x - (v.x - MAP_SIZE.w / v.k / 2)) * ppu}px`;
  el.style.insetBlockStart = `${(r.y - (v.y - MAP_SIZE.h / v.k / 2)) * ppu}px`;
  el.style.width = `${r.w * ppu}px`;
  el.style.height = `${r.h * ppu}px`;
};

const landLevel = (pxPerUnit: number) =>
  Math.max(
    0,
    LAND_LEVELS.findLastIndex((l) => l.step * pxPerUnit >= LAND_CELL_PX),
  );

const dotTile = (color: string) => {
  const tile = document.createElement('canvas');
  tile.width = LAND_TILE_PX;
  tile.height = LAND_TILE_PX;
  const ctx = tile.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(LAND_TILE_PX / 2, LAND_TILE_PX / 2, (LAND_TILE_PX * LAND_DOT) / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return tile;
};

export const drawLand = (canvas: HTMLCanvasElement, land: LandGrids, v: PanZoomView, px: number, r: MapRect) => {
  const ppu = (px * v.k) / MAP_SIZE.w;
  const level = landLevel(ppu);
  const runs = land[level];
  const dpr = Math.min(window.devicePixelRatio || 1, LAND_MAX_DPR);
  const scale = ppu * dpr;
  canvas.width = Math.max(1, Math.round(r.w * scale));
  canvas.height = Math.max(1, Math.round(r.h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx || !runs) return;
  const step = LAND_LEVELS[level]?.step ?? LAND_LEVELS[0].step;
  const cell = step * scale;
  const pattern = ctx.createPattern(dotTile(getComputedStyle(canvas).color), 'repeat');
  if (!pattern) return;
  const unit = cell / LAND_TILE_PX;
  pattern.setTransform(new DOMMatrix([unit, 0, 0, unit, -r.x * scale, -r.y * scale]));
  ctx.fillStyle = pattern;
  const top = r.y / step - 1;
  const bottom = (r.y + r.h) / step;
  const left = r.x / step - 1;
  const right = (r.x + r.w) / step;
  for (let o = 0; o < runs.length; o += 3) {
    const i = runs[o] ?? 0;
    const j = runs[o + 1] ?? 0;
    const n = runs[o + 2] ?? 0;
    if (j < top || j > bottom || i + n < left || i > right) continue;
    ctx.fillRect(i * cell - r.x * scale, j * cell - r.y * scale, n * cell, cell);
  }
};
