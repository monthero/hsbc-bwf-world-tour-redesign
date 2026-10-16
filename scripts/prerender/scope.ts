import { LOCALES, SOURCE_LOCALE, type Locale } from '../../src/i18n/locales.ts';

const MODES = ['key', 'all', 'none'] as const;
type Mode = (typeof MODES)[number];

const intFromEnv = (value: string | undefined, fallback: number) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isNaN(n) || n < 0 ? fallback : n;
};

export const LOCALE_SCOPE: Mode = MODES.find((m) => m === process.env.PRERENDER_LOCALES) ?? 'key';

export const KEY_TOP_PLAYERS = intFromEnv(process.env.PRERENDER_TOP_PLAYERS, 10);

export const KEY_SEASONS_AHEAD = intFromEnv(process.env.PRERENDER_SEASONS_AHEAD, 1);

const SOURCE_ONLY: readonly Locale[] = [SOURCE_LOCALE];

export const pageLocales = (key: boolean): readonly Locale[] => {
  if (LOCALE_SCOPE === 'all') return LOCALES;
  return LOCALE_SCOPE === 'key' && key ? LOCALES : SOURCE_ONLY;
};
