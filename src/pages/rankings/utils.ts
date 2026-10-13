import type { RankingTable, RankRow } from '~/types';
import { countryName } from '~/utils/countries';
import { formatDayMonthYear } from '~/utils/dates';
import { compareText, foldText } from '~/utils/names';

import type { CountryOption } from './types';

export const searchTokens = (q: string) => foldText(q).split(/\s+/).filter(Boolean);

export const filterRows = (rows: RankRow[], tokens: readonly string[], cc: string | undefined) => {
  if (!tokens.length && !cc) return rows;
  return rows.filter((r) => (!cc || r.countries.includes(cc)) && tokens.every((t) => r.text.includes(t)));
};

export const countryOptions = (rows: readonly RankRow[]): CountryOption[] => {
  const counts = new Map<string, number>();
  for (const r of rows) for (const cc of r.countries) counts.set(cc, (counts.get(cc) ?? 0) + 1);
  return [...counts]
    .map(([value, count]) => ({ value, label: countryName(value), count }))
    .sort((a, b) => compareText(a.label, b.label));
};

export const publicationLabel = (pub: RankingTable['publication']) =>
  `Week ${Number.parseInt(pub.week.split('-')[1] ?? '', 10)} · ${formatDayMonthYear(pub.date)}`;
