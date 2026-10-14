import type { RankingTable, RankRow } from '~/types';
import { formatDayMonthYear } from '~/utils/dates';

export const filterRows = (rows: RankRow[], tokens: readonly string[], cc: string | undefined) => {
  if (!tokens.length && !cc) return rows;
  return rows.filter((r) => (!cc || r.countries.includes(cc)) && tokens.every((t) => r.text.includes(t)));
};

export const publicationLabel = (pub: RankingTable['publication']) =>
  `Week ${Number.parseInt(pub.week.split('-')[1] ?? '', 10)} · ${formatDayMonthYear(pub.date)}`;
