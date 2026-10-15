export const LOCALES = ['en', 'zh', 'zh-hant', 'id', 'ms', 'th', 'hi', 'es', 'da', 'ko', 'ja', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const SOURCE_LOCALE: Locale = 'en';

type Script = 'latin' | 'sc' | 'tc' | 'jp' | 'kr' | 'thai' | 'deva';

interface LocaleMeta {
  name: string;
  lang: string;
  intl: string;
  script: Script;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { name: 'English', lang: 'en', intl: 'en-GB', script: 'latin' },
  zh: { name: '简体中文', lang: 'zh-Hans', intl: 'zh-CN', script: 'sc' },
  'zh-hant': { name: '繁體中文', lang: 'zh-Hant', intl: 'zh-TW', script: 'tc' },
  id: { name: 'Bahasa Indonesia', lang: 'id', intl: 'id-ID', script: 'latin' },
  ms: { name: 'Bahasa Melayu', lang: 'ms', intl: 'ms-MY', script: 'latin' },
  th: { name: 'ไทย', lang: 'th', intl: 'th-TH', script: 'thai' },
  hi: { name: 'हिन्दी', lang: 'hi', intl: 'hi-IN', script: 'deva' },
  es: { name: 'Español', lang: 'es', intl: 'es-ES', script: 'latin' },
  da: { name: 'Dansk', lang: 'da', intl: 'da-DK', script: 'latin' },
  ko: { name: '한국어', lang: 'ko', intl: 'ko-KR', script: 'kr' },
  ja: { name: '日本語', lang: 'ja', intl: 'ja-JP', script: 'jp' },
  fr: { name: 'Français', lang: 'fr', intl: 'fr-FR', script: 'latin' },
};

export const isLocale = (value: unknown): value is Locale => (LOCALES as readonly unknown[]).includes(value);

export const intlLocale = (locale: Locale) => `${LOCALE_META[locale].intl}-u-ca-gregory`;

const prefixOf = (pathname: string) => {
  const segment = pathname.split('/')[1];
  return isLocale(segment) && segment !== SOURCE_LOCALE ? segment : null;
};

export const localeInPath = (pathname: string): Locale | null => prefixOf(pathname);

export const stripLocale = (pathname: string) => {
  const locale = prefixOf(pathname);
  return locale ? pathname.slice(locale.length + 1) || '/' : pathname;
};

export const withLocale = (pathname: string, locale: Locale) => {
  const bare = stripLocale(pathname);
  if (locale === SOURCE_LOCALE) return bare;
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
};
