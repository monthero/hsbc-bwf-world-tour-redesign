import { i18n, type Messages } from '@lingui/core';
import dayjs from 'dayjs';

import { intlLocale, LOCALE_META, localeDir, type Locale } from './locales';

type Script = (typeof LOCALE_META)[Locale]['script'];

const SCRIPT_FONTS: Record<Exclude<Script, 'latin'>, { stack: string; load: () => Promise<unknown> }> = {
  sc: {
    stack: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC Variable'",
    load: () => import('@fontsource-variable/noto-sans-sc'),
  },
  tc: {
    stack: "'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC Variable'",
    load: () => import('@fontsource-variable/noto-sans-tc'),
  },
  jp: {
    stack: "'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP Variable'",
    load: () => import('@fontsource-variable/noto-sans-jp'),
  },
  kr: {
    stack: "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR Variable'",
    load: () => import('@fontsource-variable/noto-sans-kr'),
  },
  thai: {
    stack: "'Thonburi', 'Leelawadee UI', 'Noto Sans Thai Variable'",
    load: () => import('@fontsource-variable/noto-sans-thai'),
  },
  deva: {
    stack: "'Kohinoor Devanagari', 'Nirmala UI', 'Noto Sans Devanagari Variable'",
    load: () => import('@fontsource-variable/noto-sans-devanagari'),
  },
  arab: {
    stack: "'SF Arabic', 'Geeza Pro', 'Noto Sans Arabic Variable'",
    load: () => import('@fontsource-variable/noto-sans-arabic'),
  },
};

const DAYJS_LOCALES: Record<Exclude<Locale, 'en'>, { name: string; load: () => Promise<unknown> }> = {
  zh: { name: 'zh-cn', load: () => import('dayjs/locale/zh-cn') },
  'zh-hant': { name: 'zh-tw', load: () => import('dayjs/locale/zh-tw') },
  id: { name: 'id', load: () => import('dayjs/locale/id') },
  ms: { name: 'ms', load: () => import('dayjs/locale/ms') },
  th: { name: 'th', load: () => import('dayjs/locale/th') },
  hi: { name: 'hi', load: () => import('dayjs/locale/hi') },
  es: { name: 'es', load: () => import('dayjs/locale/es') },
  da: { name: 'da', load: () => import('dayjs/locale/da') },
  ko: { name: 'ko', load: () => import('dayjs/locale/ko') },
  ja: { name: 'ja', load: () => import('dayjs/locale/ja') },
  fr: { name: 'fr', load: () => import('dayjs/locale/fr') },
  tl: { name: 'tl-ph', load: () => import('dayjs/locale/tl-ph') },
  vi: { name: 'vi', load: () => import('dayjs/locale/vi') },
  'pt-br': { name: 'pt-br', load: () => import('dayjs/locale/pt-br') },
  ar: { name: 'ar-sa', load: () => import('dayjs/locale/ar-sa') },
};

const applyDayjs = async (locale: Locale) => {
  if (locale === 'en') return;
  const { name, load } = DAYJS_LOCALES[locale];
  await load();
  dayjs.locale(name);
};

const loadCatalog = async (locale: Locale): Promise<Messages> => (await import(`../locales/${locale}.po`)).messages;

const applyScript = async (script: Script) => {
  const root = document.documentElement;
  if (script === 'latin') return root.style.removeProperty('--bwf-script-font');
  const font = SCRIPT_FONTS[script];
  root.style.setProperty('--bwf-script-font', font.stack);
  await font.load();
};

export const activateLocale = async (locale: Locale) => {
  const meta = LOCALE_META[locale];
  const [messages] = await Promise.all([loadCatalog(locale), applyScript(meta.script), applyDayjs(locale)]);
  i18n.loadAndActivate({ locale, locales: intlLocale(locale), messages });
  document.documentElement.lang = meta.lang;
  document.documentElement.dir = localeDir(locale);
  document.querySelector('meta[http-equiv="content-language"]')?.setAttribute('content', meta.lang);
};
