export const LOCALES = [
  'en',
  'zh',
  'zh-hant',
  'id',
  'ms',
  'th',
  'hi',
  'es',
  'da',
  'ko',
  'ja',
  'fr',
  'tl',
  'vi',
  'pt-br',
  'ar',
] as const;
export type Locale = (typeof LOCALES)[number];

export const SOURCE_LOCALE: Locale = 'en';

type Script = 'latin' | 'sc' | 'tc' | 'jp' | 'kr' | 'thai' | 'deva' | 'arab';

interface LocaleMeta {
  name: string;
  lang: string;
  intl: string;
  script: Script;
  dir?: 'rtl';
  digits?: 'latn';
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
  tl: { name: 'Tagalog', lang: 'tl', intl: 'fil-PH', script: 'latin' },
  vi: { name: 'Tiếng Việt', lang: 'vi', intl: 'vi-VN', script: 'latin' },
  'pt-br': { name: 'Português (Brasil)', lang: 'pt-BR', intl: 'pt-BR', script: 'latin' },
  ar: { name: 'العربية', lang: 'ar', intl: 'ar', script: 'arab', dir: 'rtl', digits: 'latn' },
};

export const isLocale = (value: unknown): value is Locale => (LOCALES as readonly unknown[]).includes(value);

export const localeDir = (locale: Locale) => LOCALE_META[locale].dir ?? 'ltr';

export const intlLocale = (locale: Locale) => {
  const { intl, digits } = LOCALE_META[locale];
  return [intl, 'u-ca-gregory', ...(digits ? [`nu-${digits}`] : [])].join('-');
};

const prefixOf = (pathname: string) => {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : null;
};

export const localeInPath = (pathname: string): Locale | null => prefixOf(pathname);

export const stripLocale = (pathname: string) => {
  const locale = prefixOf(pathname);
  return locale ? pathname.slice(locale.length + 1) || '/' : pathname;
};

export const withLocale = (pathname: string, locale: Locale) => {
  const bare = stripLocale(pathname);
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
};
