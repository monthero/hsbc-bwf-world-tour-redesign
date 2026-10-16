import { msg } from '@lingui/core/macro';

import { currentLocale, regionNames } from '~/i18n/current';
import { lazyRecord } from '~/i18n/lazy';
import { SOURCE_LOCALE } from '~/i18n/locales';
import type { Continent } from '~/types';

import data from './countries.json';

const COUNTRIES: Record<string, { iso: string; name: string; region: string }> = data;

const LOCAL_FLAGS: Record<string, string> = { TPE: '/assets/flag-tpe.png', AIN: '/assets/flag-neutral.svg' };

const NAME_TO_IOC = Object.fromEntries(Object.entries(COUNTRIES).map(([ioc, c]) => [c.name, ioc]));

const SPORTS_NAMES: Readonly<Record<string, string>> = lazyRecord({
  TPE: msg({
    message: 'Chinese Taipei',
    comment:
      'Team name used by BWF and in all international sport (IOC naming). Translate the official sports name, never as "Taiwan"',
  }),
  HKG: msg({
    message: 'Hong Kong China',
    comment:
      'Team name used by BWF and in international sport for Hong Kong, China. Use the official sports name in your language',
  }),
  MAC: msg({
    message: 'Macau China',
    comment:
      'Team name used by BWF and in international sport for Macau (Macao), China. Use the official sports name in your language',
  }),
  KOR: msg({
    message: 'Korea',
    comment: 'Team name used by BWF and in international sport for the Republic of Korea (South Korea)',
  }),
  PRK: msg({
    message: 'DPR Korea',
    comment: 'Team name used by BWF and in international sport for the Democratic People’s Republic of Korea',
  }),
  PLE: msg({ message: 'Palestine', comment: 'Team name used by BWF and in international sport for Palestine' }),
  AIN: msg({
    message: 'Individual Neutral Athlete',
    comment: 'Shown instead of a country for a player competing without a national flag (neutral status)',
  }),
  ENG: msg({ message: 'England', comment: 'Country name: England, which competes on its own in badminton' }),
  SCO: msg({ message: 'Scotland', comment: 'Country name: Scotland, which competes on its own in badminton' }),
  WAL: msg({ message: 'Wales', comment: 'Country name: Wales, which competes on its own in badminton' }),
});

export const CONTINENT_NAMES: Readonly<Record<Continent, string>> = lazyRecord({
  Europe: msg({ message: 'Europe', comment: 'Continent name' }),
  Asia: msg({ message: 'Asia', comment: 'Continent name' }),
  Americas: msg({ message: 'Americas', comment: 'Continent name: North, Central and South America together' }),
  Oceania: msg({ message: 'Oceania', comment: 'Continent name: Australia, New Zealand and the Pacific islands' }),
  Africa: msg({ message: 'Africa', comment: 'Continent name' }),
  Other: msg({
    message: 'Other',
    context: 'continent',
    comment: 'Group for players whose country has no continent, e.g. neutral athletes',
  }),
});

export const flagUrl = (ioc: string) =>
  LOCAL_FLAGS[ioc] ?? `https://flagcdn.com/w40/${COUNTRIES[ioc]?.iso ?? 'un'}.png`;

export const countryCode = (name: string) => NAME_TO_IOC[name] ?? '';

const intlName = (iso: string | undefined) => {
  if (iso?.length !== 2) return undefined;
  try {
    return regionNames().of(iso.toUpperCase());
  } catch {
    return undefined;
  }
};

export const countryName = (ioc: string) => {
  const country = COUNTRIES[ioc];
  if (ioc in SPORTS_NAMES) return SPORTS_NAMES[ioc] ?? ioc;
  if (!country || currentLocale() === SOURCE_LOCALE) return country?.name ?? ioc;
  return intlName(country.iso) || country.name;
};

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

export const continentName = (continent: Continent) => CONTINENT_NAMES[continent];
