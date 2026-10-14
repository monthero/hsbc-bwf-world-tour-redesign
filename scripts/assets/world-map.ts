import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { geoContains, geoEqualEarth } from 'd3-geo';
import { feature } from 'topojson-client';
import { presimplify, quantile, simplify } from 'topojson-simplify';
import type { GeometryCollection, Topology } from 'topojson-specification';

import { writeAtomic } from '../../server/http.ts';
import { formatBytes } from '../../src/utils/format.ts';
import { prettyJson } from '../sync/util.ts';

type Ring = [number, number][];

const ROOT = path.resolve(import.meta.dirname, '../..');
const SVG_OUT = path.join(ROOT, 'public/assets/world-dots.svg');
const MAP_OUT = path.join(ROOT, 'data/map.json');

const WIDTH = 1000;
const NORTH = 75;
const SOUTH = -48;
const ANTARCTICA = -60;
const SIMPLIFY_QUANTILE = 0.3;
const STEP = 9;
const DOT = 5;

const source = fileURLToPath(import.meta.resolve('world-atlas/land-110m.json'));
const raw = JSON.parse(await fs.readFile(source, 'utf8')) as Topology<{ land: GeometryCollection }>;
const pre = presimplify(raw);
const topo = simplify(pre, quantile(pre, SIMPLIFY_QUANTILE)) as typeof raw;
const land = feature(topo, topo.objects.land);

const polygons = land.features.flatMap((f) => {
  const g = f.geometry;
  if (g.type === 'Polygon') return [g.coordinates as Ring[]];
  if (g.type === 'MultiPolygon') return g.coordinates as Ring[][];
  return [];
});
const kept = {
  type: 'MultiPolygon' as const,
  coordinates: polygons.filter(([outer = []]) => Math.max(...outer.map(([, lat]) => lat)) > ANTARCTICA),
};

const projection = geoEqualEarth().fitWidth(WIDTH, { type: 'Sphere' });
const project = (lng: number, lat: number) => projection([lng, lat]) ?? [0, 0];
const top = Math.floor(project(0, NORTH)[1]);
const height = Math.ceil(project(0, SOUTH)[1]) - top;
const [tx, ty] = projection.translate();
projection.translate([tx, ty - top]);

let d = '';
for (let y = STEP / 2; y < height; y += STEP) {
  for (let x = STEP / 2; x < WIDTH; x += STEP) {
    const at = projection.invert?.([x, y]);
    if (at && geoContains(kept, at)) d += `M${x} ${y}h0`;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}"><path d="${d}" stroke="#000" stroke-width="${DOT}" stroke-linecap="round"/></svg>\n`;
const [ox, oy] = projection.translate();
const map = { width: WIDTH, height, scale: projection.scale(), tx: ox, ty: oy };

await writeAtomic(SVG_OUT, svg);
await writeAtomic(MAP_OUT, prettyJson(map));
console.log(`world-dots.svg ${formatBytes(Buffer.byteLength(svg))}, viewBox 0 0 ${WIDTH} ${height}`);
