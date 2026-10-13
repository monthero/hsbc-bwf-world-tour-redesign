import fs from 'node:fs';

import type { ApiTournament } from './bwf.ts';

interface SeriesDef {
  id: string;
  name: string;
  match: string;
}

interface CatalogFile {
  series: SeriesDef[];
  cities: Record<string, string>;
}

export interface Edition {
  code: string;
  tmtId: number;
  seriesId: string;
  seriesName: string;
  season: number;
  level: string;
  fullName: string;
  title: string;
  subtitle: string | null;
  city: string;
  country: string;
  start: string;
  end: string;
  prize: number;
  logoVersion: string;
  headerVersion: string;
  cancelled: boolean;
  etihad: boolean;
}

const LEVELS: [RegExp, string][] = [
  [/finals$/i, 'Finals'],
  [/super 1000$/i, '1000'],
  [/super 750$/i, '750'],
  [/super 500$/i, '500'],
  [/super 300$/i, '300'],
];

const STATUS_NOTE = /\s*\((?:cancell?ed|new dates|postponed|formerly [^)]*)\)\s*/gi;
const YEAR = /\b(?:19|20)\d{2}\b/g;
const TAIL = /\s+((?:powered|presented)\s+by\s+.+|by\s+[A-Z]{3,}.*)$/;

export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export const slugify = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

const versionOf = (url: string | null) => url?.match(/\/v(\d+)\//)?.[1] ?? '';

const day = (s: string) => s.slice(0, 10);

export const loadCatalog = (file: string) => {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as CatalogFile;
  const series = raw.series.map((s) => ({ ...s, re: new RegExp(s.match, 'i') }));
  const unknown = new Set<string>();

  const seriesOf = (core: string) => {
    const folded = fold(core);
    const hit = series.find((s) => s.re.test(folded));
    if (hit) return { id: hit.id, name: hit.name };
    unknown.add(core);
    const name = core.replace(/^(?:[^a-z]*[A-Z0-9][^a-z\s]*\s+)+(?=[A-Z][a-z])/, '');
    return { id: slugify(name), name };
  };

  const place = (location: string) => {
    const parts = location
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const city = parts[0] ?? '';
    return { city: raw.cities[city] ?? city, country: parts.length > 1 ? (parts.at(-1) ?? '') : '' };
  };

  const edition = (t: ApiTournament, calendarYear: number): Edition | null => {
    const level = LEVELS.find(([re]) => re.test(t.category))?.[1];
    if (!level) return null;
    const named = clean(t.name.replace(STATUS_NOTE, ' '));
    const nameYear = Number(named.match(YEAR)?.[0]);
    const title = clean(named.replace(YEAR, ' '));
    const tail = title.match(TAIL);
    const core = tail ? title.slice(0, tail.index) : title;
    const s = seriesOf(core);
    const { city, country } = place(t.location);
    return {
      code: t.code,
      tmtId: t.id,
      seriesId: s.id,
      seriesName: s.name,
      season: nameYear || calendarYear,
      level,
      fullName: t.name,
      title,
      subtitle: tail?.[1] ?? null,
      city,
      country: country || t.country || '',
      start: day(t.start_date),
      end: day(t.end_date),
      prize: Number((t.prize_money ?? '').replace(/[^\d.]/g, '')) || 0,
      logoVersion: versionOf(t.logo),
      headerVersion: versionOf(t.header_url_tpl),
      cancelled: t.status?.code === 'cancelled',
      etihad: !!t.is_etihad,
    };
  };

  return { edition, unknown };
};
