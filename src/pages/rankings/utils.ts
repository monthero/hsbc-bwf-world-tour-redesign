import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { RankingTable, RankRow } from '~/types';
import { formatDayMonthYear } from '~/utils/dates';

export const filterRows = (rows: RankRow[], tokens: readonly string[], cc: string | undefined) => {
  if (!tokens.length && !cc) return rows;
  return rows.filter((r) => (!cc || r.countries.includes(cc)) && tokens.every((t) => r.text.includes(t)));
};

export const publicationLabel = (i18n: I18n, pub: RankingTable['publication']) => {
  const week = Number.parseInt(pub.week.split('-')[1] ?? '', 10);
  const date = formatDayMonthYear(pub.date);
  return i18n._(
    msg({ message: `Week ${week} · ${date}`, comment: 'Ranking publication: week number of the year and its date' }),
  );
};
