import { msg } from '@lingui/core/macro';

import { listFormat, numberFormat } from '~/i18n/current';
import { lazyRecord, translate } from '~/i18n/lazy';

import { CM_PER_INCH, INCHES_PER_FOOT, KG_PER_LB, parsePlays, type Hand } from './parse';

export { formatBytes } from './bytes';
export { HANDS, parseHeightCm, parsePlays, parseTension, tidySpaces, type Hand } from './parse';

export const formatNumber = (n: number) => numberFormat().format(n);

export const isolateLtr = (text: string) => `\u2066${text}\u2069`;

export const isolate = (text: string) => `\u2068${text}\u2069`;

export const formatRecord = (wins: number, losses: number) =>
  isolateLtr(`${formatNumber(wins)}–${formatNumber(losses)}`);

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

const COUNTS = {
  video: msg({
    message: '{count, plural, one {# video} other {# videos}}',
    comment: 'Number of YouTube videos, e.g. "3 videos"',
  }),
  point: msg({
    message: '{count, plural, one {# point} other {# points}}',
    comment: 'Number of rallies (points) played in a badminton match, e.g. "84 points"',
  }),
  meeting: msg({
    message: '{count, plural, one {# meeting} other {# meetings}}',
    comment: 'Number of times two players or pairs have played each other, e.g. "5 meetings"',
  }),
  event: msg({
    message: '{count, plural, one {# event} other {# events}}',
    comment: 'Number of tournaments on a calendar, e.g. "12 events"',
  }),
  tournament: msg({
    message: '{count, plural, one {# tournament} other {# tournaments}}',
    comment: 'Number of tournaments, e.g. "14 tournaments"',
  }),
  story: msg({
    message: '{count, plural, one {# story} other {# stories}}',
    comment: 'Number of news stories, e.g. "8 stories"',
  }),
  country: msg({
    message: '{count, plural, one {# country} other {# countries}}',
    comment: 'Number of countries, e.g. "11 countries"',
  }),
  title: msg({
    message: '{count, plural, one {# title} other {# titles}}',
    comment: 'Number of tournament wins (titles), e.g. "3 titles"',
  }),
  week: msg({
    message: '{count, plural, one {# week} other {# weeks}}',
    comment: 'Number of weeks, e.g. how long a player held a ranking: "for 12 weeks"',
  }),
  seed: msg({
    message: '{count, plural, one {# seed} other {# seeds}}',
    comment:
      'Number of seeded players or pairs, e.g. "8 seeds". A seed is a top-ranked entry placed in the draw so they cannot meet early',
  }),
  match: msg({
    message: '{count, plural, one {# match} other {# matches}}',
    comment: 'Number of badminton matches, e.g. "12 matches"',
  }),
  entry: msg({
    message: '{count, plural, one {# entry} other {# entries}}',
    comment: 'Number of players or pairs entered in a tournament draw, e.g. "32 entries"',
  }),
  player: msg({
    message: '{count, plural, one {# player} other {# players}}',
    comment: 'Number of players, e.g. "120 players"',
  }),
  pair: msg({
    message: '{count, plural, one {# pair} other {# pairs}}',
    comment: 'Number of doubles pairs (two players playing together), e.g. "64 pairs"',
  }),
};

export type CountUnit = keyof typeof COUNTS;

const isCountUnit = (unit: string): unit is CountUnit => Object.hasOwn(COUNTS, unit);

export const countLabel = (n: number, unit: CountUnit) => translate(COUNTS[unit], { count: n });

export const plural = (n: number, one: string, many = `${one}s`) =>
  isCountUnit(one) ? countLabel(n, one) : `${formatNumber(n)} ${n === 1 ? one : many}`;

export const formatList = (items: readonly string[]) => listFormat().format(items);

const LABEL_VALUE = msg({
  message: '{label}: {value}',
  comment:
    'A label and its value in a one-line summary or tooltip, e.g. "Won: 1". Adjust the colon and spacing for your language',
});

export const labelValue = (label: string, value: string | number) => translate(LABEL_VALUE, { label, value });

export const joinDots = (parts: readonly (string | null | undefined | false)[]) =>
  parts
    .filter((p): p is string => !!p)
    .map(isolate)
    .join(' · ');

const MINUTES = { style: 'unit', unit: 'minute', unitDisplay: 'short' } as const;

export const formatDuration = (min: number) => (min ? numberFormat(MINUTES).format(min) : '');

export const HEIGHT_UNIT = 'cm';
export const HEIGHT_UNITS = ['cm', 'ftin'] as const;
type HeightUnit = (typeof HEIGHT_UNITS)[number];

const formatFeetInches = (cm: number) => {
  const inches = Math.round(cm / CM_PER_INCH);
  return `${Math.floor(inches / INCHES_PER_FOOT)}′${inches % INCHES_PER_FOOT}″`;
};

export const formatHeight = (cm: number, unit: HeightUnit = 'cm') =>
  unit === 'ftin' ? formatFeetInches(cm) : `${cm} ${HEIGHT_UNIT}`;

export const heightParts = (cm: number, unit: HeightUnit) =>
  unit === 'ftin' ? { value: formatFeetInches(cm) } : { value: String(cm), unit: HEIGHT_UNIT };

export const HAND_LABELS: Record<Hand, string> = lazyRecord({
  R: msg({
    message: 'Right',
    context: 'playing hand',
    comment: 'Player profile: the player holds the racket in the right hand (right-handed)',
  }),
  L: msg({
    message: 'Left',
    context: 'playing hand',
    comment: 'Player profile: the player holds the racket in the left hand (left-handed)',
  }),
});

export const handLabel = (value: unknown) => {
  const hand = parsePlays(value);
  return hand ? HAND_LABELS[hand] : '';
};

export const TENSION_UNIT = 'lbs';
export const TENSION_UNITS = [TENSION_UNIT, 'kg'] as const;
type TensionUnit = (typeof TENSION_UNITS)[number];

const kg = (lbs: number) => String(Math.round(lbs * KG_PER_LB * 10) / 10);

export const tensionParts = (lbs: string, unit: TensionUnit) =>
  unit === 'kg' ? { value: lbs.split('/').map(Number).map(kg).join('/'), unit } : { value: lbs, unit };
