import { dayjs, ISO_DAY } from '~/utils/dates';
import { formatBytes, formatHeight, TENSION_UNIT } from '~/utils/format';
import { localAsset, playerHeroUrl, playerThumbUrl } from '~/utils/images';
import { titleCase } from '~/utils/names';
import { nameIssue } from '~/utils/surname';

import {
  overrideValue,
  provenanceOf,
  bioKeyOf,
  canonicalOverride,
  decodeBio,
  decodeFraming,
  DEFAULT_SOURCE,
  encodeBio,
  FramingKey,
  imageAssetPath,
  isBioFieldKey,
  isFramingField,
  isImageField,
  isNameField,
  isTopField,
  NAME_KEY,
  overriddenKeys,
  RETIRED_KEY,
  sameProvenance,
  type AdminPlayer,
  type BioFieldKey,
  type BioKey,
  type BioValues,
  type EquipmentKind,
  type FieldKey,
  type ImageKind,
  type ImageResult,
  type PlayerOverride,
  type Provenance,
  type TopKey,
} from './schema';

export type FieldInput =
  | 'name'
  | 'text'
  | 'long'
  | 'date'
  | 'month'
  | 'height'
  | 'tension'
  | 'plays'
  | 'image'
  | 'catalog';
export type FieldState = 'bwf' | 'override' | 'none';

export interface FieldDef {
  key: FieldKey;
  label: string;
  group: string;
  input: FieldInput;
  missing?: boolean;
  badge?: boolean;
  catalog?: EquipmentKind;
  trustBwf?: boolean;
  format?: (value: string) => string;
}

export interface BioFieldDef extends FieldDef {
  key: BioFieldKey;
}

const bio = (
  key: BioKey,
  label: string,
  group: string,
  input: FieldInput = 'text',
  extra?: Pick<FieldDef, 'missing' | 'badge' | 'catalog' | 'trustBwf' | 'format'>,
) => ({ key: `bio.${key}`, label, group, input, ...extra }) satisfies BioFieldDef;

const EQUIPMENT = 'Equipment';
export const IMAGES = 'Images';

const FIELDS: readonly FieldDef[] = [
  { key: NAME_KEY, label: 'Display name', group: 'Identity', input: 'name' },
  { key: RETIRED_KEY, label: 'Retired since', group: 'Identity', input: 'month' },
  { key: 'photo', label: 'Photo', group: IMAGES, input: 'image', missing: true, badge: true },
  { key: 'hero', label: 'Hero', group: IMAGES, input: 'image', missing: true, badge: true },
  bio('born', 'Born', 'Personal', 'date'),
  bio('height', 'Height', 'Personal', 'height', { format: (v) => formatHeight(Number(v)) }),
  bio('plays', 'Plays', 'Personal', 'plays'),
  bio('nickname', 'Nickname', 'Personal'),
  bio('birthplace', 'Birthplace', 'Personal'),
  bio('residence', 'Lives in', 'Personal'),
  bio('languages', 'Languages', 'Personal'),
  bio('natTeam', 'National team', 'Career'),
  bio('debut', 'Intl. debut', 'Career'),
  bio('started', 'Started competing', 'Career'),
  bio('coach', 'Coach', 'Career'),
  bio('club', 'Club', 'Career'),
  bio('prize', 'Prize money', 'Career'),
  bio('racket', 'Racket', EQUIPMENT, 'catalog', { missing: true, catalog: 'racket', trustBwf: false }),
  bio('racketNote', 'Racket extras', EQUIPMENT, 'text', { trustBwf: false }),
  bio('tension', 'Tension', EQUIPMENT, 'tension', { trustBwf: false, format: (v) => `${v} ${TENSION_UNIT}` }),
  bio('tensionNote', 'Tension note', EQUIPMENT, 'text', { trustBwf: false }),
  bio('string', 'String', EQUIPMENT, 'catalog', { catalog: 'string', trustBwf: false }),
  bio('shoes', 'Shoes', EQUIPMENT, 'catalog', { catalog: 'shoes', trustBwf: false }),
  bio('achievements', 'Memorable achievements', 'Story', 'long'),
  bio('ambition', 'Ambition', 'Story', 'long'),
  bio('idol', 'Sporting hero', 'Story'),
  bio('instagram', 'Instagram', 'Social'),
  bio('facebook', 'Facebook', 'Social'),
];

export const STATUS_FIELDS = FIELDS.filter((f) => f.missing || f.badge);
export const BADGE_FIELDS = FIELDS.filter((f) => f.badge);
export const MISSING_FIELDS = FIELDS.filter((f) => f.missing);

export const EQUIPMENT_FIELDS = FIELDS.filter((f) => f.group === EQUIPMENT);

const isBioField = (f: FieldDef): f is BioFieldDef => isBioFieldKey(f.key);

export const BIO_FIELDS = [
  ...FIELDS.filter((f) => f.group === EQUIPMENT),
  ...FIELDS.filter((f) => f.group !== EQUIPMENT),
].filter(isBioField);

export const FIELD_BY_KEY = new Map(FIELDS.map((f) => [f.key, f]));

export const FIELD_GROUPS = [...new Set(FIELDS.map((f) => f.group))].map((group) => ({
  group,
  fields: FIELDS.filter((f) => f.group === group),
}));

export const nameError = (draft: Draft) => {
  const name = draft.fields[NAME_KEY]?.value.trim();
  return name ? nameIssue(name) : null;
};

export const PLAYS_OPTIONS = ['Right-handed', 'Left-handed'];

export const bwfValue = (p: AdminPlayer, key: FieldKey) => {
  if (isNameField(key)) return p.name;
  if (isImageField(key)) return p[key] ?? '';
  if (isTopField(key) || isFramingField(key)) return '';
  const bioKey = bioKeyOf(key);
  return encodeBio(decodeBio(bioKey, p.bio[bioKey]));
};

export const effectiveValue = (p: AdminPlayer, key: FieldKey) => overrideValue(p.override, key) || bwfValue(p, key);

export const formatField = (field: FieldDef | undefined, value: string) =>
  value && field?.format ? field.format(value) : value;

export const displayName = (p: AdminPlayer) => titleCase(effectiveValue(p, NAME_KEY));

export const fieldState = (p: AdminPlayer, key: FieldKey): FieldState => {
  if (overrideValue(p.override, key)) return 'override';
  return bwfValue(p, key) ? 'bwf' : 'none';
};

export const imageUrl = (kind: ImageKind, id: string, value: string) => {
  if (!value) return '';
  return kind === 'photo' ? playerThumbUrl(value) : playerHeroUrl(id, value, false);
};

export const overrideImage = (kind: ImageKind, id: string, value: string | null | undefined) =>
  value ? imageAssetPath(id, kind) : '';

export const effectiveImage = (p: AdminPlayer, kind: ImageKind) =>
  overrideImage(kind, p.id, p.override?.[kind]) || p[kind];

export const overrideImageUrl = (kind: ImageKind, id: string, value: string) => {
  const asset = overrideImage(kind, id, value);
  return asset && localAsset(asset);
};

export const imageSummary = (img: ImageResult) =>
  `${img.sourceWidth}×${img.sourceHeight} ${formatBytes(img.bytesIn)} → ${img.width}×${img.height} WebP ${formatBytes(img.bytesOut)}`;

export const versioned = (src: string, version: number) => (src && version ? `${src}?v=${version}` : src);

export const todayStamp = () => dayjs().format(ISO_DAY);

export interface FieldDraft extends Provenance {
  value: string;
}

export type FieldChange = (key: FieldKey, draft: FieldDraft | undefined, image?: ImageResult) => void;

export interface Draft {
  fields: Partial<Record<FieldKey, FieldDraft>>;
  notes: string;
}

export const freshDraft = (value: string, source = DEFAULT_SOURCE): FieldDraft => ({
  value,
  source,
  asOf: todayStamp(),
});

export const withValue = (draft: FieldDraft | undefined, value: string) => {
  if (!value) return undefined;
  return draft ? { ...draft, value } : freshDraft(value);
};

export const toDraft = (e: PlayerOverride | null): Draft => ({
  fields: Object.fromEntries(overriddenKeys(e).map((k) => [k, { value: overrideValue(e, k), ...provenanceOf(e, k) }])),
  notes: e?.notes ?? '',
});

const topProvenance = (base: PlayerOverride | null, first: FieldDraft | undefined): Provenance | null => {
  if (base?.source !== undefined) return { source: base.source, asOf: base.asOf };
  if (!first) return null;
  return { source: first.source.trim() || DEFAULT_SOURCE, asOf: first.asOf || undefined };
};

const DRAFT_KEYS: readonly FieldKey[] = [...FIELDS.map((f) => f.key), ...FramingKey.options];

export const fromDraft = (draft: Draft, base: PlayerOverride | null): PlayerOverride | null => {
  const filled = DRAFT_KEYS.flatMap((key) => {
    const d = draft.fields[key];
    return d?.value.trim() ? [{ key, d }] : [];
  });
  const top = topProvenance(base, filled[0]?.d);
  const tops: Partial<Record<TopKey, string>> = {};
  const images: Partial<Record<ImageKind, string>> = {};
  const framing: Partial<Record<FramingKey, string>> = {};
  const bioValues: BioValues = {};
  const meta: Partial<Record<FieldKey, Provenance>> = {};
  for (const { key, d } of filled) {
    if (isTopField(key)) tops[key] = d.value.trim();
    else if (isImageField(key)) images[key] = d.value.trim();
    else if (isFramingField(key)) framing[key] = d.value.trim();
    else bioValues[bioKeyOf(key)] = decodeBio(bioKeyOf(key), d.value);
    if (top && !sameProvenance(d, top))
      meta[key] = { source: d.source.trim() || DEFAULT_SOURCE, ...(d.asOf && { asOf: d.asOf }) };
  }
  return canonicalOverride({
    ...base,
    name: tops.name,
    retired: tops.retired,
    photo: images.photo,
    hero: images.hero,
    ...Object.fromEntries(FramingKey.options.map((k) => [k, decodeFraming(k, framing[k])])),
    bio: bioValues,
    source: top?.source,
    asOf: top?.asOf,
    notes: draft.notes,
    meta,
  });
};

export interface BulkChange {
  player: AdminPlayer;
  bwf: string;
  current: string;
  next: string;
}

export const planBulk = (players: readonly AdminPlayer[], key: BioFieldKey, value: string | null): BulkChange[] => {
  const bioKey = bioKeyOf(key);
  const wanted = value === null ? undefined : decodeBio(bioKey, value);
  return players.flatMap((player) => {
    const bwf = bwfValue(player, key);
    const current = overrideValue(player.override, key);
    const next = wanted ?? decodeBio(bioKey, bwf);
    return decodeBio(bioKey, current || bwf) === next ? [] : [{ player, bwf, current, next: encodeBio(next) }];
  });
};
