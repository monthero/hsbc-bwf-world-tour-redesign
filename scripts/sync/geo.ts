import path from 'node:path';

import { readJsonFile } from './util.ts';

interface City {
  country: string;
  lat: number;
  lng: number;
  tz?: string;
}

interface MapFrame {
  width: number;
  height: number;
  scale: number;
  tx: number;
  ty: number;
}

export interface MapPoint {
  x: number;
  y: number;
}

const DATA = path.resolve(import.meta.dirname, '../../data');
const TBC = 'TBC';
const RAD = Math.PI / 180;
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

const round1 = (n: number) => Math.round(n * 10) / 10;

const equalEarth = (lat: number, lng: number): [number, number] => {
  const l = Math.asin(M * Math.sin(lat * RAD));
  const l2 = l * l;
  const l6 = l2 * l2 * l2;
  const x = (lng * RAD * Math.cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)));
  const y = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2));
  return [x, y];
};

export const createMapPlacer = () => {
  const cities = readJsonFile<Record<string, City>>(path.join(DATA, 'cities.json'));
  const frame = readJsonFile<MapFrame>(path.join(DATA, 'map.json'));
  const missing = new Set<string>();

  const cityOf = (city: string, country: string) => {
    if (!city || city === TBC) return null;
    const c = cities[city];
    if (c && (!country || c.country === country)) return c;
    missing.add(country ? `${city}, ${country}` : city);
    return null;
  };

  const zoneOf = (city: string, country: string) => cityOf(city, country)?.tz ?? null;

  const pointOf = (city: string, country: string): MapPoint | null => {
    const c = cityOf(city, country);
    if (!c) return null;
    const [x, y] = equalEarth(c.lat, c.lng);
    return { x: round1(frame.tx + frame.scale * x), y: round1(frame.ty - frame.scale * y) };
  };

  const warn = () => {
    if (missing.size) console.warn(`  ! cities not in data/cities.json: ${[...missing].join(' · ')}`);
  };

  return { pointOf, zoneOf, warn };
};
