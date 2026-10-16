import { i18n, type Messages } from '@lingui/core';

import { intlLocale, isLocale, LOCALE_META, localeDir, SOURCE_LOCALE, withLocale, type Locale } from '~/i18n/locales';
import { resolveDocumentMeta, SITE_NAME, translateMetaText, type Translate } from '~/utils/meta';

import type { CreateRenderer, PrerenderPage } from '../contract';
import { createStore } from './data';
import { checkTemplate, esc, link, renderDocument, type Alternate } from './document';
import { navLinks, pageView, type Crumb, type Ctx } from './pages';

const ogLocale = (locale: Locale) => {
  const { intl } = LOCALE_META[locale];
  return intl.includes('-') ? intl.replace('-', '_') : `${intl}_${intl.toUpperCase()}`;
};

const breadcrumbs = (crumbs: readonly Crumb[], url: (path: string) => string) =>
  crumbs.length > 1
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            item: url(c.path),
          })),
        },
      ]
    : [];

export const createRenderer: CreateRenderer = ({ origin, template, readJson, catalogs }) => {
  checkTemplate(template);
  const store = createStore(readJson);
  const _: Translate = (descriptor) => i18n._(descriptor);
  let active: Locale | null = null;

  const activate = (locale: Locale) => {
    if (active === locale) return;
    i18n.loadAndActivate({ locale, locales: intlLocale(locale), messages: catalogs[locale] as Messages });
    store.resetLocale();
    active = locale;
  };

  const render = (page: PrerenderPage) => {
    const { locale } = page;
    if (!isLocale(locale)) return null;
    activate(locale);
    const href = (path: string) => withLocale(path, locale);
    const ctx: Ctx = { _, store, href, text: (value) => translateMetaText(_, value) ?? '' };
    const view = pageView(ctx, page.path, new URLSearchParams(page.search));
    if (!view) return null;
    const query = page.search ? `?${page.search}` : '';
    const urlIn = (l: Locale) => `${origin}${withLocale(page.path, l)}${query}`;
    const url = urlIn(locale);
    const meta = resolveDocumentMeta(_, view.meta);
    const alternates: Alternate[] =
      page.locales.length > 1
        ? page.locales
            .filter(isLocale)
            .map((l) => ({ hreflang: LOCALE_META[l].lang, href: urlIn(l), ogLocale: ogLocale(l) }))
        : [];
    const head = {
      meta,
      url,
      ogLocale: ogLocale(locale),
      alternates,
      defaultHref: urlIn(SOURCE_LOCALE),
      jsonLd: [...(view.jsonLd?.(meta, url) ?? []), ...breadcrumbs(view.crumbs, (path) => `${origin}${href(path)}`)],
    };
    const body = `<header>${link(href('/'), _(SITE_NAME))}<nav>${navLinks(ctx)}</nav></header><main><h1>${esc(meta.page)}</h1><p>${esc(meta.description)}</p>${view.body}</main>`;
    return renderDocument(template, LOCALE_META[locale].lang, localeDir(locale), head, body);
  };

  return { render };
};
