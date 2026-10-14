import { countryName } from './countries';
import { formatNumber, plural } from './format';
import { compareText, foldText } from './names';

export interface CountOption {
  value: string;
  label: string;
  count: number;
}

export const shownLabel = (shown: number, total: number, unit: string) =>
  `${shown === total ? '' : `${formatNumber(shown)} of `}${plural(total, unit)}`;

export const toggleItem = <T>(list: readonly T[] | undefined, item: T): T[] | undefined => {
  const next = list?.includes(item) ? list.filter((x) => x !== item) : [...(list ?? []), item];
  return next.length ? next : undefined;
};

export const searchTokens = (q: string) => foldText(q).split(/\s+/).filter(Boolean);

export const countBy = <T>(rows: readonly T[], keysOf: (row: T) => readonly string[]) => {
  const counts = new Map<string, number>();
  for (const r of rows) for (const k of keysOf(r)) counts.set(k, (counts.get(k) ?? 0) + 1);
  return counts;
};

export const countryOptions = <T>(rows: readonly T[], ccsOf: (row: T) => readonly string[]): CountOption[] =>
  [...countBy(rows, ccsOf)]
    .map(([value, count]) => ({ value, label: countryName(value), count }))
    .sort((a, b) => compareText(a.label, b.label));
