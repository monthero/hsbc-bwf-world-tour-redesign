import { useLingui } from '@lingui/react';
import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

import { SITE_ORIGIN } from '~/constants';
import { currentLocale } from '~/i18n/current';
import { withLocale } from '~/i18n/locales';
import {
  PAGE_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  type DocumentMeta,
  type MetaText,
  type MetaType,
  type Translate,
} from '~/utils/meta';

interface ResolvedMeta {
  site: string;
  page: string;
  title: string;
  description: string;
  type: MetaType;
  url?: string;
  image?: string;
}

type MetaTag = readonly [attr: 'name' | 'property', key: string, value: (m: ResolvedMeta) => string | undefined];

const TAGS: readonly MetaTag[] = [
  ['name', 'description', (m) => m.description],
  ['property', 'og:site_name', (m) => m.site],
  ['property', 'og:title', (m) => m.page],
  ['property', 'og:description', (m) => m.description],
  ['property', 'og:type', (m) => m.type],
  ['property', 'og:url', (m) => m.url],
  ['property', 'og:image', (m) => m.image],
  ['name', 'twitter:card', (m) => (m.image ? 'summary_large_image' : 'summary')],
  ['name', 'twitter:title', (m) => m.page],
  ['name', 'twitter:description', (m) => m.description],
  ['name', 'twitter:image', (m) => m.image],
];

const setTag = (attr: MetaTag[0], key: string, content: string | undefined) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) return el?.remove();
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.content = content;
};

const applyMeta = (m: ResolvedMeta) => {
  document.title = m.title;
  for (const [attr, key, value] of TAGS) setTag(attr, key, value(m));
};

const translate = (_: Translate, text: MetaText | undefined) => (typeof text === 'object' ? _(text) : text);

const absolute = (url: string | undefined) => (url?.startsWith('/') ? `${SITE_ORIGIN}${url}` : url);

const NO_META: DocumentMeta = {};

export const useDocumentMeta = (meta: DocumentMeta | undefined) => {
  const { title, description, image, type = 'website' } = meta ?? NO_META;
  const { _ } = useLingui();
  const { pathname, searchStr } = useLocation();
  const site = _(SITE_NAME);
  const fallback = _(SITE_DESCRIPTION);
  const page = translate(_, title) || site;
  const full = page === site ? site : _({ ...PAGE_TITLE, values: { page, site } });
  const text = translate(_, description) || fallback;
  const picture = absolute(image);
  const url = `${SITE_ORIGIN}${withLocale(pathname, currentLocale())}${searchStr}`;

  useEffect(() => {
    applyMeta({
      site,
      page,
      title: full,
      description: text,
      type,
      url,
      image: picture,
    });
    return () => applyMeta({ site, page: site, title: site, description: fallback, type: 'website' });
  }, [site, fallback, page, full, text, type, picture, url]);
};
