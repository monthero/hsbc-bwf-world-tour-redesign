import type { Player } from '~/types';

import { cleanName, isSurnameWord, surnameOf } from './surname';

export { foldText } from './fold';

export const titleCase = (s: string) =>
  s
    .split(' ')
    .map((w) => (isSurnameWord(w) ? w[0] + w.slice(1).toLowerCase() : w))
    .join(' ');

export const compareText = (a: string, b: string) => a.localeCompare(b);

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

export interface NameForm {
  first: string;
  last: string;
}

const initial = (w: string) => `${w.charAt(0)}.`;

const distinct = (forms: NameForm[]) =>
  forms.filter((f, i) => !i || f.first !== forms[i - 1]?.first || f.last !== forms[i - 1]?.last);

export const nameForms = (p: Player): NameForm[] => {
  if (!p.last) return [];
  const { first, last } = p;
  const [head = ''] = (p.surnameFirst ? last : first).split(' ');
  const full = { first, last };
  const out = distinct(
    p.surnameFirst ? [full, { first, last: initial(head) }] : [full, { first: initial(head), last }],
  );
  return out.length > 1 ? out : [];
};

export const toPlayer = (rawName: string, cc: string, id: string): Player => {
  const raw = cleanName(rawName);
  const ws = raw.split(' ');
  const surnameFirst = ws.length > 1 && isSurnameWord(ws[0] ?? '');
  let cut = surnameFirst ? ws.findIndex((w) => !isSurnameWord(w)) : ws.findIndex(isSurnameWord);
  if (cut <= 0) cut = ws.length;
  return {
    id,
    raw,
    name: titleCase(raw),
    first: titleCase(ws.slice(0, cut).join(' ')),
    last: titleCase(ws.slice(cut).join(' ')),
    surnameFirst,
    surname: titleCase(surnameOf(raw)),
    cc,
  };
};
