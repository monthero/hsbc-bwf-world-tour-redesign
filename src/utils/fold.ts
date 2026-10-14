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

export const foldWords = (s: string) =>
  foldText(s)
    .split(/[^a-z]+/)
    .filter(Boolean);
