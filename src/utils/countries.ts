import type { Continent } from '~/types';

import data from './countries.json';

const COUNTRIES: Record<string, { iso: string; name: string; region: string }> = data;

const LOCAL_FLAGS: Record<string, string> = { TPE: '/assets/flag-tpe.png', AIN: '/assets/flag-neutral.svg' };

const NAME_TO_IOC = Object.fromEntries(Object.entries(COUNTRIES).map(([ioc, c]) => [c.name, ioc]));

export const flagUrl = (ioc: string) =>
  LOCAL_FLAGS[ioc] ?? `https://flagcdn.com/w40/${COUNTRIES[ioc]?.iso ?? 'un'}.png`;

export const countryCode = (name: string) => NAME_TO_IOC[name] ?? '';

export const countryName = (ioc: string) => COUNTRIES[ioc]?.name ?? ioc;

const REGIONAL_A = 0x1f1e6;
const TAG_BASE = 0xe0000;
const BLACK_FLAG = String.fromCodePoint(0x1f3f4);
const CANCEL_TAG = String.fromCodePoint(0xe007f);
const codePoints = (text: string, base: number, from = 'a') =>
  Array.from({ length: text.length }, (_, i) =>
    String.fromCodePoint(base + text.charCodeAt(i) - from.charCodeAt(0)),
  ).join('');

export const flagEmoji = (ioc: string) => {
  const iso = COUNTRIES[ioc]?.iso ?? '';
  if (iso.length === 2) return codePoints(iso, REGIONAL_A);
  if (iso.startsWith('gb-')) return BLACK_FLAG + codePoints(iso.replace('-', ''), TAG_BASE, '\0') + CANCEL_TAG;
  return ioc;
};

export const continentOf = (ioc: string): Continent => (COUNTRIES[ioc]?.region as Continent | undefined) ?? 'Other';
