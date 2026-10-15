import type { CascaderOption } from '@mantine/core';

import { searchTokens } from '~/utils/filter';
import { foldText } from '~/utils/names';

import type { Brand, EquipmentRow } from './schema';

const MAX_BRAND_WORDS = 3;

export const compactKey = (s: string) => foldText(s).replace(/[^a-z0-9]/g, '');

const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);

export interface BrandMatcher {
  id: string;
  name: string;
  keys: readonly string[];
}

export const brandMatchers = (brands: readonly Brand[]): BrandMatcher[] =>
  brands.map((b) => ({ id: b.id, name: b.name, keys: [b.name, ...b.aliases].map(compactKey) }));

export const splitBrand = (value: string, brands: readonly BrandMatcher[]) => {
  const ws = words(value);
  for (const brand of brands)
    for (let i = 1; i <= Math.min(MAX_BRAND_WORDS, ws.length); i++)
      if (brand.keys.includes(compactKey(ws.slice(0, i).join('')))) return { brand, rest: ws.slice(i) };
  return null;
};

export const isBrandOnly = (value: string, brands: readonly BrandMatcher[]) => {
  const key = compactKey(value);
  return !!key && brands.some((b) => b.keys.includes(key));
};

export const guessParts = (value: string, brands: readonly BrandMatcher[]) => {
  const hit = splitBrand(value, brands);
  return { brandId: hit?.brand.id ?? '', model: (hit?.rest ?? words(value)).join(' ') };
};

const byAdoption = (order: readonly string[]) => {
  const rank = new Map(order.map((key, i) => [key, i]));
  return (a: string, b: string) =>
    (rank.get(compactKey(a)) ?? Infinity) - (rank.get(compactKey(b)) ?? Infinity) || a.localeCompare(b);
};

export const byPopularity = (brands: readonly Brand[], order: readonly string[]) => {
  const sort = byAdoption(order);
  return [...brands].sort((a, b) => sort(a.name, b.name));
};

const brandNode = (brand: string) => `brand:${brand}`;
const leaf = (r: EquipmentRow): CascaderOption => ({ value: r.name, label: r.model });

export const catalogTree = (rows: readonly EquipmentRow[], order: readonly string[]): CascaderOption[] =>
  [...new Set(rows.map((r) => r.brand))].sort(byAdoption(order)).map((brand) => ({
    value: brandNode(brand),
    label: brand,
    children: rows.filter((r) => r.brand === brand).map(leaf),
  }));

export const catalogPath = (rows: readonly EquipmentRow[], value: string) => {
  const key = compactKey(value);
  const row = key ? rows.find((r) => compactKey(r.name) === key) : undefined;
  return row ? [brandNode(row.brand), row.name] : null;
};

export const catalogSearch = (query: string, path: readonly CascaderOption[]) => {
  const tokens = searchTokens(query);
  const name = path.at(-1)?.value ?? '';
  const text = foldText(name);
  const compact = compactKey(name);
  return tokens.every((t) => text.includes(t) || compact.includes(compactKey(t)));
};
