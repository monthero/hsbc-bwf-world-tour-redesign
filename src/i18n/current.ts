import { i18n } from '@lingui/core';

import { intlLocale, isLocale, SOURCE_LOCALE, type Locale } from './locales.ts';

export const currentLocale = (): Locale => (isLocale(i18n.locale) ? i18n.locale : SOURCE_LOCALE);

const cache = new Map<string, Intl.NumberFormat>();

export const numberFormat = (options: Intl.NumberFormatOptions = {}) => {
  const tag = intlLocale(currentLocale());
  const key = `${tag}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) cache.set(key, (format = new Intl.NumberFormat(tag, options)));
  return format;
};
