import { listFormat, numberFormat } from '../i18n/current.ts';

export const formatNumber = (n: number) => numberFormat().format(n);

export const formatRank = (n: number | null | undefined, empty = '—') => (n ? `#${n}` : empty);

const CHANGE_ARROW = { up: '▲', down: '▼' } as const;

export const changeDir = (n: number): 'up' | 'down' | undefined => {
  if (n > 0) return 'up';
  return n < 0 ? 'down' : undefined;
};

export const formatChange = (n: number) => {
  const dir = changeDir(n);
  return dir ? `${CHANGE_ARROW[dir]}${Math.abs(n)}` : '';
};

export const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

export const formatList = (items: readonly string[]) => listFormat().format(items);

export const joinDots = (parts: readonly (string | null | undefined | false)[]) => parts.filter(Boolean).join(' · ');

export const formatDuration = (min: number) => (min ? `${min} min` : '');

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

export const formatBytes = (bytes: number) => {
  const exp = Math.min(BYTE_UNITS.length - 1, bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(1024)) : 0);
  const value = bytes / 1024 ** exp;
  return `${exp && value < 10 ? value.toFixed(1) : Math.round(value)} ${BYTE_UNITS[exp]}`;
};

export const HEIGHT_UNIT = 'cm';
export const HEIGHT_UNITS = ['cm', 'ftin'] as const;
type HeightUnit = (typeof HEIGHT_UNITS)[number];
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
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

const formatFeetInches = (cm: number) => {
  const inches = Math.round(cm / CM_PER_INCH);
  return `${Math.floor(inches / INCHES_PER_FOOT)}′${inches % INCHES_PER_FOOT}″`;
};

export const formatHeight = (cm: number, unit: HeightUnit = 'cm') =>
  unit === 'ftin' ? formatFeetInches(cm) : `${cm} ${HEIGHT_UNIT}`;

export const heightParts = (cm: number, unit: HeightUnit) =>
  unit === 'ftin' ? { value: formatFeetInches(cm) } : { value: String(cm), unit: HEIGHT_UNIT };

export const HANDS = ['R', 'L'] as const;
export type Hand = (typeof HANDS)[number];
export const HAND_LABELS: Record<Hand, string> = { R: 'Right', L: 'Left' };
const HAND = /^(r|l)(?:ight|eft)?(?:[\s-]*handed)?$/i;

export const parsePlays = (value: unknown): Hand | null => {
  if (typeof value !== 'string') return null;
  const hand = HAND.exec(value.trim())?.[1]?.toUpperCase();
  return hand === 'R' || hand === 'L' ? hand : null;
};

export const handLabel = (value: unknown) => {
  const hand = parsePlays(value);
  return hand ? HAND_LABELS[hand] : '';
};

export const tidySpaces = (text: string) => text.replace(/[^\S\r\n]+/g, ' ').trim();

export const TENSION_UNIT = 'lbs';
export const TENSION_UNITS = [TENSION_UNIT, 'kg'] as const;
type TensionUnit = (typeof TENSION_UNITS)[number];
const KG_PER_LB = 0.45359237;
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

const kg = (lbs: number) => String(Math.round(lbs * KG_PER_LB * 10) / 10);

export const tensionParts = (lbs: string, unit: TensionUnit) =>
  unit === 'kg' ? { value: lbs.split('/').map(Number).map(kg).join('/'), unit } : { value: lbs, unit };
