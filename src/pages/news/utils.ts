import type { NewsMonthCount } from '~/api/schemas';
import { formatMonth, formatWall, monthOf } from '~/utils/dates';

import { CARD_MIN_WIDTH, CARD_RATIO, GRID_GAP, GRID_ROW_GAP, ROW_ESTIMATE } from './constants';
import type { ArchiveRow, ArchiveYear, MonthGroup } from './types';

const MONTHS_IN_YEAR = 12;

export const buildArchive = (months: readonly NewsMonthCount[]): ArchiveYear[] => {
  const years = new Map<number, ArchiveYear>();
  for (const m of months) {
    const d = monthOf(m.month);
    const year = d.year();
    let entry = years.get(year);
    if (!entry) {
      entry = { year, total: 0, months: Array.from({ length: MONTHS_IN_YEAR }, () => null) };
      years.set(year, entry);
    }
    entry.total += m.count;
    entry.months[d.month()] = { key: m.month, label: formatMonth(m.month), count: m.count };
  }
  return [...years.values()].sort((a, b) => b.year - a.year);
};

const MONTH_FORMATS = {
  long: { month: 'long' },
  short: { month: 'short' },
  shortYear: { month: 'short', year: '2-digit' },
} as const;

export const formatMonthName = (key: string, style: keyof typeof MONTH_FORMATS) =>
  formatWall(monthOf(key), MONTH_FORMATS[style]);

const BASE_YEAR = '2000';

export const monthShort = (index: number) =>
  formatMonthName(`${BASE_YEAR}-${String(index + 1).padStart(2, '0')}`, 'short');

export const columnsFor = (width: number) => Math.max(1, Math.floor((width + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)));

export const buildRows = (groups: readonly MonthGroup[], perRow: number, subscribe: boolean): ArchiveRow[] => {
  const rows: ArchiveRow[] = [];
  groups.forEach((group, gi) => {
    rows.push({ kind: 'head', key: `${group.key}:head`, group });
    if (group.failed) rows.push({ kind: 'failed', key: `${group.key}:failed`, group });
    else {
      const n = group.stories?.length ?? group.total;
      for (let i = 0; i < n; i += perRow)
        rows.push({
          kind: 'stories',
          key: `${group.key}:${perRow}:${i}`,
          group,
          stories: group.stories?.slice(i, i + perRow),
          size: Math.min(perRow, n - i),
          first: i === 0,
          last: i + perRow >= n,
        });
    }
    if (subscribe && gi === 0) rows.push({ kind: 'subscribe', key: 'subscribe', group });
  });
  return rows;
};

export const estimateRow = (row: ArchiveRow | undefined, compact: boolean, width: number, perRow: number) => {
  switch (row?.kind) {
    case 'head':
      return compact ? ROW_ESTIMATE.head.mobile : ROW_ESTIMATE.head.desktop;
    case 'failed':
      return ROW_ESTIMATE.failed;
    case 'subscribe':
      return ROW_ESTIMATE.subscribe;
    case 'stories': {
      if (compact) return ROW_ESTIMATE.compact;
      const column = (width - (perRow - 1) * GRID_GAP) / perRow;
      return column * CARD_RATIO + ROW_ESTIMATE.cardBody + (row.last ? 0 : GRID_ROW_GAP);
    }
    default:
      return 0;
  }
};
