import { useLocaleStore } from '~/stores/locale';

import { withLocale, type Locale } from './locales';

export const switchLocale = (locale: Locale) => {
  useLocaleStore.getState().choose(locale);
  const { pathname, search, hash } = window.location;
  window.location.assign(withLocale(pathname, locale) + search + hash);
};
