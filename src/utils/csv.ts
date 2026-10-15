const BOM = '﻿';
const NEEDS_QUOTES = /[",\r\n]/;

export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.startsWith(BOM) ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c !== '"') cell += c;
      else if (src[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows.filter((r) => r.some((v) => v.trim()));
};

const quote = (value: string) => (NEEDS_QUOTES.test(value) ? `"${value.replaceAll('"', '""')}"` : value);

export const toCsv = (rows: readonly (readonly string[])[]) =>
  BOM + rows.map((r) => r.map(quote).join(',')).join('\n') + '\n';
