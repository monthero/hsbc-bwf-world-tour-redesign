import fs from 'node:fs';
import path from 'node:path';

import { ImageKind } from '../../src/pages/admin/schema.ts';
import { prettyJson, readJsonFile, type readOverrides } from './util.ts';

export interface ImageCredit {
  author: string;
  license: string;
  licenseUrl?: string;
  page: string;
}

type Overrides = ReturnType<typeof readOverrides>;

export const CREDITS_FILE = 'image-credits.json';

export const readCredits = (dataDir: string) =>
  readJsonFile<Record<string, ImageCredit>>(path.join(dataDir, CREDITS_FILE), {});

const isWikimedia = (source: string) => /^https:\/\/[a-z.]*\bwikimedia\.org\//.test(source);

export const wikimediaImages = (overrides: Overrides) =>
  Object.entries(overrides).flatMap(([id, entry]) =>
    ImageKind.options.flatMap((kind) => {
      const source = entry[kind];
      return source && isWikimedia(source) ? [{ id, kind, source }] : [];
    }),
  );

export const creditIssues = (overrides: Overrides, credits: Record<string, ImageCredit>) =>
  wikimediaImages(overrides)
    .filter(({ source }) => !credits[source])
    .map(({ id, kind }) => `Player ${id}: the Wikimedia ${kind} has no credit, run pnpm credits`);

const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'bwf-redesign-credits/1.0 (fan project)';
const BATCH = 50;

interface ImageInfo {
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string } | undefined>;
}

interface ApiResponse {
  query?: {
    normalized?: { from: string; to: string }[];
    pages?: Record<string, { title: string; imageinfo?: ImageInfo[] }>;
  };
}

const fileOf = (source: string) => {
  const parts = new URL(source).pathname.split('/');
  const thumb = parts.indexOf('thumb');
  return decodeURIComponent((thumb >= 0 ? parts[thumb + 3] : parts.at(-1)) ?? '');
};

const plain = (html: string | undefined) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const lookup = async (titles: readonly string[]) => {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'extmetadata|url',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
  });
  const res = await fetch(`${API}?${params.toString()}`, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Commons answered ${res.status}`);
  const { query } = (await res.json()) as ApiResponse;
  const asked = new Map((query?.normalized ?? []).map((n) => [n.to, n.from]));
  return Object.values(query?.pages ?? {}).flatMap((page): [string, ImageCredit][] => {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata;
    if (!info?.descriptionurl || !meta) return [];
    const licenseUrl = meta.LicenseUrl?.value;
    return [
      [
        asked.get(page.title) ?? page.title,
        {
          author: plain(meta.Artist?.value),
          license: plain(meta.LicenseShortName?.value),
          ...(licenseUrl && { licenseUrl }),
          page: info.descriptionurl,
        },
      ],
    ];
  });
};

export const refreshCredits = async (dataDir: string, overrides: Overrides) => {
  const images = wikimediaImages(overrides);
  const titles = [...new Set(images.map((i) => `File:${fileOf(i.source)}`))];
  const found = new Map<string, ImageCredit>();
  for (let i = 0; i < titles.length; i += BATCH)
    for (const [title, credit] of await lookup(titles.slice(i, i + BATCH))) found.set(title, credit);
  const credits = Object.fromEntries(
    images
      .flatMap(({ source }): [string, ImageCredit][] => {
        const credit = found.get(`File:${fileOf(source)}`);
        return credit ? [[source, credit]] : [];
      })
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  fs.writeFileSync(path.join(dataDir, CREDITS_FILE), prettyJson(credits));
  return { found: Object.keys(credits).length, total: images.length };
};
