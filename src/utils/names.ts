import type { Player } from '~/types';

import { cleanName, isSurnameWord } from './surname';

export const titleCase = (s: string) =>
  s
    .split(' ')
    .map((w) => (isSurnameWord(w) ? w[0] + w.slice(1).toLowerCase() : w))
    .join(' ');

export const compareText = (a: string, b: string) => a.localeCompare(b);

const LETTER_FOLDS: Record<string, string> = {
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
  đ: 'd',
  ð: 'd',
  ł: 'l',
  þ: 'th',
  ı: 'i',
};

export const foldText = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[øæœßđðłþı]/g, (c) => LETTER_FOLDS[c] ?? c);

const shouty = (s: string) => s === s.toUpperCase() && /[A-Z]/.test(s);

export const unshout = (s: string) =>
  shouty(s) ? s.toLowerCase().replace(/(^|[\s,/(\-'])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase()) : s;

export const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const toPlayer = (rawName: string, cc: string, id: string): Player => {
  const raw = cleanName(rawName);
  const ws = raw.split(' ');
  const surnameFirst = ws.length > 1 && isSurnameWord(ws[0] ?? '');
  let cut = surnameFirst ? ws.findIndex((w) => !isSurnameWord(w)) : ws.findIndex(isSurnameWord);
  if (cut <= 0) cut = ws.length;
  const upper = ws.filter(isSurnameWord);
  return {
    id,
    raw,
    name: titleCase(raw),
    first: titleCase(ws.slice(0, cut).join(' ')),
    last: titleCase(ws.slice(cut).join(' ')),
    surnameFirst,
    surname: titleCase(upper.length ? upper.join(' ') : (ws.at(-1) ?? raw)),
    cc,
  };
};
