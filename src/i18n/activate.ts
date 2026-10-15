import { i18n, type Messages } from '@lingui/core';

import { LOCALE_META, type Locale } from './locales';

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
  const [messages] = await Promise.all([loadCatalog(locale), applyScript(meta.script)]);
  i18n.loadAndActivate({ locale, messages });
  document.documentElement.lang = meta.lang;
  document.querySelector('meta[http-equiv="content-language"]')?.setAttribute('content', meta.lang);
};
