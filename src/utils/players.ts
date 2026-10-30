import { msg } from '@lingui/core/macro';

import { lazyRecord, translate } from '~/i18n/lazy';
import type { HeightUnit, TensionUnit } from '~/stores/settings';
import type { BioView, FactItem, PhotoCrop, PlayerBio, PlayerDirectory, StatItem } from '~/types';

import { ageOn, formatDayMonthYear } from './dates';
import { formatNumber, handLabel, HEIGHT_UNIT, heightParts, parseTension, TENSION_UNIT, tensionParts } from './format';
import { playerSquareUrl, playerThumbUrl } from './images';
import { unshout } from './names';

const facts = (
  list: {
    key: string;
    label: string;
    value: string | undefined;
    sub?: string;
    brand?: string;
    translated?: boolean;
  }[],
  fmt: (s: string) => string,
) =>
  list.flatMap((f): FactItem[] => {
    const sub = f.sub?.trim();
    return f.value
      ? [
          {
            key: f.key,
            label: f.label,
            value: fmt(f.value),
            ...(sub && { sub }),
            ...(f.brand && { brand: f.brand }),
            ...(!f.translated && { lang: 'en' }),
          },
        ]
      : [];
  });

const keep = (s: string) => s;

const LABELS = lazyRecord({
  age: msg({ message: 'Age', comment: 'Player profile stat: the player’s age in years' }),
  height: msg({ message: 'Height', comment: 'Player profile stat: how tall the player is' }),
  hand: msg({
    message: 'Playing hand',
    comment: 'Player profile stat: the hand the player holds the racket in (right or left)',
  }),
  nickname: msg({ message: 'Nickname', comment: 'Player profile fact' }),
  birthplace: msg({ message: 'Birthplace', comment: 'Player profile fact: the town or city the player was born in' }),
  residence: msg({ message: 'Lives in', comment: 'Player profile fact: the town or city the player lives in' }),
  languages: msg({ message: 'Languages', comment: 'Player profile fact: the languages the player speaks' }),
  debut: msg({
    message: 'Intl. debut',
    comment: 'Player profile fact: when the player first competed internationally. "Intl." is short for international',
  }),
  natTeam: msg({
    message: 'National team',
    comment: 'Player profile fact: since when the player has been on their country’s national team',
  }),
  coach: msg({ message: 'Coach', comment: 'Player profile fact: the player’s coach' }),
  club: msg({ message: 'Club', comment: 'Player profile fact: the badminton club the player plays for' }),
  racket: msg({ message: 'Racket', comment: 'Player equipment: the badminton racket model the player uses' }),
  tension: msg({
    message: 'Tension',
    comment: 'Player equipment: how tightly the racket strings are pulled, in pounds or kilograms, e.g. "28 lbs"',
  }),
  string: msg({ message: 'String', comment: 'Player equipment: the racket string model the player uses' }),
  shoes: msg({ message: 'Shoes', comment: 'Player equipment: the badminton shoe model the player wears' }),
  achievements: msg({ message: 'Memorable achievements', comment: 'Player profile: the player’s proudest results' }),
  idol: msg({ message: 'Sporting hero', comment: 'Player profile: the athlete the player looks up to' }),
  started: msg({
    message: 'Started competing',
    comment: 'Player profile: when or how the player started playing badminton competitively',
  }),
});

const BORN = msg({
  message: 'Born {date}',
  comment: 'Player profile: date of birth under the age, e.g. "Born 4 Jan 1994"',
});

const SINCE = msg({
  message: 'Since {start}',
  comment: 'Player profile, national team: when the player joined, e.g. "Since 2012"',
});

const LEADING_SINCE = /^since\s*/i;

const sentence = (s: string) => {
  const t = unshout(s);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const socialUrl = (value: string | undefined, host: string) => {
  if (!value?.includes(host) || /\s/.test(value)) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

export interface BioUnits {
  height: HeightUnit;
  tension: TensionUnit;
}

export const DEFAULT_BIO_UNITS: BioUnits = { height: HEIGHT_UNIT, tension: TENSION_UNIT };

const PRE_STRETCH = msg({
  message: '+{percent}% pre-stretch',
  comment:
    'Player equipment, string tension note: the stringer pre-stretches the string by this percentage before tensioning it',
});

const PRE_STRETCH_NOTE = /^\+?\s*(\d+(?:[.,]\d+)?)\s*%\s*pre-?stretch$/i;

const tensionNote = (note: string): Pick<FactItem, 'sub' | 'lang'> => {
  const percent = PRE_STRETCH_NOTE.exec(note)?.[1];
  if (percent) return { sub: translate(PRE_STRETCH, { percent: formatNumber(Number(percent.replace(',', '.'))) }) };
  return { sub: note, lang: 'en' };
};

const tensionFact = (b: PlayerBio, unit: TensionUnit): FactItem[] => {
  const lbs = parseTension(b.tension);
  const note = b.tensionNote?.trim();
  return lbs
    ? [{ key: 'tension', label: LABELS.tension, ...tensionParts(lbs, unit), ...(note && tensionNote(note)) }]
    : [];
};

export const buildBio = (bio: PlayerBio | undefined, units: BioUnits): BioView => {
  const b = bio ?? {};
  const stats: StatItem[] = [];
  if (b.born) {
    const born = formatDayMonthYear(b.born);
    stats.push({
      key: 'age',
      label: LABELS.age,
      value: String(ageOn(b.born)),
      sub: translate(BORN, { date: born }),
      date: born,
    });
  } else if (b.age) stats.push({ key: 'age', label: LABELS.age, value: String(b.age) });
  if (b.height) stats.push({ key: 'height', label: LABELS.height, ...heightParts(b.height, units.height) });
  const hand = handLabel(b.plays);
  if (hand) stats.push({ key: 'hand', label: LABELS.hand, value: hand });
  const natTeam = b.natTeam?.trim();
  const details = [
    ...facts(
      [
        { key: 'nickname', label: LABELS.nickname, value: b.nickname },
        { key: 'birthplace', label: LABELS.birthplace, value: b.birthplace },
        { key: 'residence', label: LABELS.residence, value: b.residence },
        { key: 'languages', label: LABELS.languages, value: b.languages },
        { key: 'debut', label: LABELS.debut, value: b.debut },
        {
          key: 'natTeam',
          label: LABELS.natTeam,
          value: natTeam && translate(SINCE, { start: natTeam.replace(LEADING_SINCE, '') }),
          translated: true,
        },
        { key: 'coach', label: LABELS.coach, value: b.coach },
      ],
      unshout,
    ),
    ...facts([{ key: 'club', label: LABELS.club, value: b.club }], keep),
  ];
  const equipment = [
    ...facts(
      [
        { key: 'racket', label: LABELS.racket, value: b.racket, sub: b.racketNote, brand: b.racketBrand },
        { key: 'string', label: LABELS.string, value: b.string, brand: b.stringBrand },
      ],
      keep,
    ),
    ...tensionFact(b, units.tension),
    ...facts([{ key: 'shoes', label: LABELS.shoes, value: b.shoes, sub: b.shoesNote, brand: b.shoesBrand }], keep),
  ];
  const notes = facts(
    [
      { key: 'achievements', label: LABELS.achievements, value: b.achievements },
      { key: 'idol', label: LABELS.idol, value: b.idol },
      { key: 'started', label: LABELS.started, value: b.started },
    ],
    sentence,
  );
  const links = facts(
    [
      { key: 'instagram', label: 'Instagram', value: socialUrl(b.instagram, 'instagram.com') },
      { key: 'facebook', label: 'Facebook', value: socialUrl(b.facebook, 'facebook.com') },
    ],
    keep,
  );
  return { stats, details, equipment, notes, links, prize: b.prize ?? '', ambition: b.ambition ?? '' };
};

export interface PhotoOptions {
  photo?: string | null;
  size?: number;
  framing?: PhotoCrop | null;
}

export const playerPhoto = (
  dir: PlayerDirectory | undefined,
  id: string,
  { photo, size, framing }: PhotoOptions = {},
) => {
  const record = dir?.get(id);
  const own = photo || record?.photo;
  const crop = framing === undefined ? (own === record?.photo && record?.photoCrop) || null : framing;
  const thumb = playerThumbUrl(own);
  return { src: size && !crop ? playerSquareUrl(thumb, size) : thumb, crop };
};
