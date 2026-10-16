export const CM_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;
const HEIGHT_RANGE = { min: 100, max: 250 };
const METRES_BELOW = 3;
const FEET_INCHES = /(\d+)\s*(?:'|′|ft)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|″|in)?)?/i;
const METRIC = /(\d+(?:[.,]\d+)?)\s*(cm|m)?/i;

const plausibleCm = (cm: number) =>
  Number.isFinite(cm) && cm >= HEIGHT_RANGE.min && cm <= HEIGHT_RANGE.max ? Math.round(cm) : null;

const metricCm = (n: number, unit: string | undefined) =>
  unit?.toLowerCase() === 'm' || (!unit && n < METRES_BELOW) ? n * 100 : n;

export const parseHeightCm = (value: unknown): number | null => {
  if (typeof value === 'number') return plausibleCm(metricCm(value, undefined));
  if (typeof value !== 'string') return null;
  const imperial = FEET_INCHES.exec(value);
  if (imperial?.[1])
    return plausibleCm((Number(imperial[1]) * INCHES_PER_FOOT + Number(imperial[2] ?? 0)) * CM_PER_INCH);
  const metric = METRIC.exec(value);
  return metric?.[1] ? plausibleCm(metricCm(Number.parseFloat(metric[1].replace(',', '.')), metric[2])) : null;
};

export const HANDS = ['R', 'L'] as const;
export type Hand = (typeof HANDS)[number];
const HAND = /^(r|l)(?:ight|eft)?(?:[\s-]*handed)?$/i;

export const parsePlays = (value: unknown): Hand | null => {
  if (typeof value !== 'string') return null;
  const hand = HAND.exec(value.trim())?.[1]?.toUpperCase();
  return hand === 'R' || hand === 'L' ? hand : null;
};

export const tidySpaces = (text: string) => text.replace(/[^\S\r\n]+/g, ' ').trim();

export const KG_PER_LB = 0.45359237;
const TENSION_RANGE = { min: 15, max: 40 };
const TENSION = /^(\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?$/;

const plausibleLbs = (n: number) => n >= TENSION_RANGE.min && n <= TENSION_RANGE.max;

export const parseTension = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value)
    .toLowerCase()
    .replace(/lbs?|\s/g, '')
    .replaceAll(',', '.')
    .replaceAll('x', '/');
  const m = TENSION.exec(text);
  if (!m) return null;
  const parts = [m[1], m[2]].filter((p): p is string => !!p).map(Number);
  return parts.every(plausibleLbs) ? parts.join('/') : null;
};
