import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { geoEqualEarth, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { filter, filterWeight, presimplify, simplify } from 'topojson-simplify';
import type { GeometryCollection, Topology } from 'topojson-specification';

import { writeAtomic } from '../../server/http.ts';
import { LAND_DETAILS, type LandDetail } from '../../src/pages/about/landLevels.ts';
import { formatBytes } from '../../src/utils/bytes.ts';
import { prettyJson } from '../sync/util.ts';

type World = Topology<{ countries: GeometryCollection; land: GeometryCollection }>;

const ROOT = path.resolve(import.meta.dirname, '../..');
const ASSETS = path.join(ROOT, 'public/assets');
const MAP_OUT = path.join(ROOT, 'data/map.json');

const WIDTH = 1000;
const NORTH = 75;
const SOUTH = -48;
const ANTARCTICA = -60;
const EDGE = 2;
const SOURCES: Record<LandDetail, { file: string; quantum: number; minWeight: number; minArea: number }> = {
  coarse: { file: 'countries-110m.json', quantum: 10, minWeight: 0, minArea: 0 },
  fine: { file: 'countries-50m.json', quantum: 20, minWeight: 1e-3, minArea: 1e-2 },
};

const readWorld = async (name: string) => {
  const source = fileURLToPath(import.meta.resolve(`world-atlas/${name}`));
  return JSON.parse(await fs.readFile(source, 'utf8')) as World;
};

const projection = geoEqualEarth().fitWidth(WIDTH, { type: 'Sphere' });
const project = (lng: number, lat: number) => projection([lng, lat]) ?? [0, 0];
const top = Math.floor(project(0, NORTH)[1]);
const height = Math.ceil(project(0, SOUTH)[1]) - top;
const [tx, ty] = projection.translate();
projection.translate([tx, ty - top]);
const [ox, oy] = projection.translate();
const frame = { width: WIDTH, height, scale: projection.scale(), tx: ox, ty: oy };
projection.clipExtent([
  [-EDGE, -EDGE],
  [WIDTH + EDGE, height + EDGE],
]);

const pathWriter = (quantum: number) => {
  let d = '';
  let x = 0;
  let y = 0;
  let line = false;
  const at = (n: number) => Math.round(n * quantum);
  const pair = (a: number, b: number) => `${a}${b < 0 ? '' : ' '}${b}`;
  return {
    moveTo(px: number, py: number) {
      x = at(px);
      y = at(py);
      d += `M${pair(x, y)}`;
      line = false;
    },
    lineTo(px: number, py: number) {
      const nx = at(px);
      const ny = at(py);
      if (nx === x && ny === y) return;
      const step = pair(nx - x, ny - y);
      const lead = nx - x < 0 ? '' : ' ';
      d += line ? `${lead}${step}` : `l${step}`;
      line = true;
      x = nx;
      y = ny;
    },
    closePath() {
      d += 'z';
      line = false;
    },
    arc() {},
    beginPath() {},
    result: () => d,
  };
};

const draw = (geo: GeoPermissibleObjects, quantum: number) => {
  const writer = pathWriter(quantum);
  geoPath(projection, writer)(geo);
  return writer.result();
};

const reachesNorth = (polygon: number[][][]) => Math.max(...(polygon[0] ?? []).map(([, lat = 0]) => lat)) > ANTARCTICA;

const level = async (detail: LandDetail) => {
  const { file, quantum, minWeight, minArea } = SOURCES[detail];
  const raw = await readWorld(file);
  const kept = minArea ? (filter(raw, filterWeight(raw, minArea)) as World) : raw;
  const topo = (minWeight ? simplify(presimplify(kept), minWeight) : kept) as World;
  const land = feature(topo, topo.objects.land);
  const shapes = ('features' in land ? land.features : [land]).flatMap((f) => {
    const g = f.geometry;
    if (g.type === 'Polygon') return reachesNorth(g.coordinates) ? [f] : [];
    if (g.type !== 'MultiPolygon') return [f];
    return [{ ...f, geometry: { ...g, coordinates: g.coordinates.filter(reachesNorth) } }];
  });
  const borders = mesh(topo, topo.objects.countries, (a, b) => a !== b);
  const json = JSON.stringify({
    quantum,
    land: shapes.map((s) => draw(s, quantum)).join(''),
    borders: draw(borders, quantum),
  });
  const out = path.join(ASSETS, LAND_DETAILS[detail]);
  await writeAtomic(out, `${json}\n`);
  return `${LAND_DETAILS[detail]} ${formatBytes(Buffer.byteLength(json))}`;
};

const written = [await level('coarse'), await level('fine')];
await writeAtomic(MAP_OUT, prettyJson(frame));
console.log(`${written.join(', ')}, map ${WIDTH} × ${height}`);
