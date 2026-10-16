import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { geoBounds, geoContains, geoEqualEarth } from 'd3-geo';
import { feature } from 'topojson-client';
import { presimplify, quantile, simplify } from 'topojson-simplify';
import type { GeometryCollection, Topology } from 'topojson-specification';

import { writeAtomic } from '../../server/http.ts';
import { LAND_DOT, LAND_LEVELS } from '../../src/pages/about/mapLevels.ts';
import { formatBytes } from '../../src/utils/bytes.ts';
import { prettyJson } from '../sync/util.ts';

type Ring = [number, number][];
type Polygon = Ring[];

const ROOT = path.resolve(import.meta.dirname, '../..');
const SVG_OUT = path.join(ROOT, 'public/assets/world-dots.svg');
const MAP_OUT = path.join(ROOT, 'data/map.json');

const WIDTH = 1000;
const NORTH = 75;
const SOUTH = -48;
const ANTARCTICA = -60;
const SIMPLIFY_QUANTILE = 0.3;
const DASH = 0.01;

const readLand = async (name: string) => {
  const source = fileURLToPath(import.meta.resolve(`world-atlas/${name}`));
  return JSON.parse(await fs.readFile(source, 'utf8')) as Topology<{ land: GeometryCollection }>;
};

const polygonsOf = (topo: Topology<{ land: GeometryCollection }>) =>
  feature(topo, topo.objects.land).features.flatMap((f) => {
    const g = f.geometry;
    if (g.type === 'Polygon') return [g.coordinates as Polygon];
    if (g.type === 'MultiPolygon') return g.coordinates as Polygon[];
    return [];
  });

const aboveAntarctica = ([outer = []]: Polygon) => Math.max(...outer.map(([, lat]) => lat)) > ANTARCTICA;

const indexed = (polygons: Polygon[]) =>
  polygons.filter(aboveAntarctica).map((coordinates) => {
    const shape = { type: 'Polygon' as const, coordinates };
    return { shape, bounds: geoBounds(shape) };
  });

const coarseTopo = await readLand('land-110m.json');
const pre = presimplify(coarseTopo);
const coarse = indexed(polygonsOf(simplify(pre, quantile(pre, SIMPLIFY_QUANTILE)) as typeof coarseTopo));
const fine = indexed(polygonsOf(await readLand('land-50m.json')));

const projection = geoEqualEarth().fitWidth(WIDTH, { type: 'Sphere' });
const project = (lng: number, lat: number) => projection([lng, lat]) ?? [0, 0];
const top = Math.floor(project(0, NORTH)[1]);
const height = Math.ceil(project(0, SOUTH)[1]) - top;
const [tx, ty] = projection.translate();
projection.translate([tx, ty - top]);

const inBounds = ([lng, lat]: [number, number], [[w, s], [e, n]]: [[number, number], [number, number]]) =>
  lat >= s && lat <= n && (w <= e ? lng >= w && lng <= e : lng >= w || lng <= e);

const onLand = (land: ReturnType<typeof indexed>, at: [number, number]) =>
  land.some((p) => inBounds(at, p.bounds) && geoContains(p.shape, at));

const levelPath = (step: number, land: ReturnType<typeof indexed>) => {
  const cols = Math.floor(WIDTH / step);
  const rows = Math.floor(height / step);
  let d = '';
  for (let j = 0; j < rows; j++) {
    let end = -1;
    let start = -1;
    const flush = (i: number) => {
      if (start < 0) return;
      d += end < 0 ? `M${start} ${j}h${i - start}` : `m${start - end} 0h${i - start}`;
      end = i;
      start = -1;
    };
    for (let i = 0; i < cols; i++) {
      const at = projection.invert?.([(i + 0.5) * step, (j + 0.5) * step]);
      const hit = !!at && onLand(land, at);
      if (hit && start < 0) start = i;
      if (!hit) flush(i);
    }
    flush(cols);
  }
  return d;
};

const paths = LAND_LEVELS.map(({ id, step }, i) => {
  const d = levelPath(step, i ? fine : coarse);
  return `<path id="${id}" transform="scale(${step}) translate(0 .5)" stroke-width="${+LAND_DOT.toFixed(3)}" stroke-dasharray="${DASH} ${1 - DASH}" stroke-dashoffset="${0.5 + DASH / 2}" stroke-linecap="round" d="${d}"/>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" fill="none" stroke="#000">${paths.join('')}</svg>\n`;
const [ox, oy] = projection.translate();
const map = { width: WIDTH, height, scale: projection.scale(), tx: ox, ty: oy };

await writeAtomic(SVG_OUT, svg);
await writeAtomic(MAP_OUT, prettyJson(map));
console.log(
  `world-dots.svg ${formatBytes(Buffer.byteLength(svg))}, viewBox 0 0 ${WIDTH} ${height}, levels ${LAND_LEVELS.map((l) => l.step).join(' / ')}`,
);
