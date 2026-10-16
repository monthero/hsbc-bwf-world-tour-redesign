import type { ResolvedDocumentMeta } from '~/utils/meta';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

export const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;

const wrapItem = (item: string) => `<li>${item}</li>`;

export const list = (items: readonly string[]) => (items.length ? `<ul>${items.map(wrapItem).join('')}</ul>` : '');

export const section = (heading: string, content: string) => (content ? `<h2>${esc(heading)}</h2>${content}` : '');

export interface Alternate {
  hreflang: string;
  href: string;
  ogLocale: string;
}

export interface Head {
  meta: ResolvedDocumentMeta;
  url: string;
  ogLocale: string;
  alternates: readonly Alternate[];
  defaultHref: string;
  jsonLd: readonly object[];
}

const metaTag = (attr: 'name' | 'property', key: string, content: string | undefined) =>
  content ? `<meta ${attr}="${key}" content="${esc(content)}" />` : '';

const jsonLdScript = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', String.raw`\u003c`)}</script>`;

const headTags = ({ meta, url, ogLocale, alternates, defaultHref, jsonLd }: Head) =>
  [
    `<title>${esc(meta.title)}</title>`,
    metaTag('name', 'description', meta.description),
    `<link rel="canonical" href="${esc(url)}" />`,
    ...alternates.map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" />`),
    alternates.length ? `<link rel="alternate" hreflang="x-default" href="${esc(defaultHref)}" />` : '',
    metaTag('property', 'og:site_name', meta.site),
    metaTag('property', 'og:title', meta.page),
    metaTag('property', 'og:description', meta.description),
    metaTag('property', 'og:type', meta.type),
    metaTag('property', 'og:url', url),
    metaTag('property', 'og:locale', ogLocale),
    ...alternates
      .filter((a) => a.ogLocale !== ogLocale)
      .map((a) => metaTag('property', 'og:locale:alternate', a.ogLocale)),
    metaTag('property', 'og:image', meta.image),
    metaTag('name', 'twitter:card', meta.image ? 'summary_large_image' : 'summary'),
    metaTag('name', 'twitter:title', meta.page),
    metaTag('name', 'twitter:description', meta.description),
    metaTag('name', 'twitter:image', meta.image),
    ...jsonLd.map(jsonLdScript),
  ]
    .filter(Boolean)
    .join('\n    ');

const VISUALLY_HIDDEN =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';

const TITLE = /<title>[\s\S]*?<\/title>/;
const STATIC_META = /\s*<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>/g;
const HTML_LANG = /<html lang="[^"]*" dir="[^"]*"/;
const CONTENT_LANGUAGE = /(<meta http-equiv="content-language" content=")[^"]*"/;
const ROOT = '<div id="root"></div>';

const REQUIRED: Record<string, RegExp> = {
  '<title>': TITLE,
  '<html lang dir>': HTML_LANG,
  'the content-language meta': CONTENT_LANGUAGE,
  [ROOT]: /<div id="root"><\/div>/,
};

export const checkTemplate = (template: string) => {
  const missing = Object.entries(REQUIRED).flatMap(([name, re]) => (re.test(template) ? [] : [name]));
  if (missing.length) throw new Error(`dist/index.html is missing ${missing.join(', ')}`);
};

export const renderDocument = (template: string, lang: string, dir: string, head: Head, body: string) =>
  template
    .replace(HTML_LANG, `<html lang="${lang}" dir="${dir}"`)
    .replace(CONTENT_LANGUAGE, `$1${lang}"`)
    .replace(STATIC_META, '')
    .replace(TITLE, () => headTags(head))
    .replace(ROOT, () => `<div id="root"><div style="${VISUALLY_HIDDEN}">${body}</div></div>`);
