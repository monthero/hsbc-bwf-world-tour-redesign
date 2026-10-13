import { z } from 'zod';

import { EventCode, Focus, PhotoCrop } from '../../api/schemas.ts';
import { parseHeightCm } from '../../utils/format.ts';
import { cleanName, nameIssue } from '../../utils/surname.ts';

export const BIO_KEYS = [
  'born',
  'height',
  'plays',
  'nickname',
  'birthplace',
  'residence',
  'languages',
  'natTeam',
  'debut',
  'started',
  'coach',
  'club',
  'racket',
  'string',
  'shoes',
  'bag',
  'prize',
  'achievements',
  'ambition',
  'idol',
  'instagram',
  'facebook',
] as const;

export const BioKey = z.enum(BIO_KEYS);
export type BioKey = z.infer<typeof BioKey>;

export type BioValue = string | number;
export type BioValues = Partial<Record<BioKey, BioValue>>;

const BIO_PARSERS: Partial<Record<BioKey, (value: unknown) => number | null>> = { height: parseHeightCm };

export const decodeBio = (key: BioKey, value: unknown): BioValue | undefined => {
  const parse = BIO_PARSERS[key];
  if (parse) return parse(value) ?? undefined;
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  return text || undefined;
};

export const encodeBio = (value: BioValue | undefined) => (value === undefined ? '' : String(value));

const decodeAllBio = (bio: Partial<Record<BioKey, unknown>> | undefined): BioValues =>
  Object.fromEntries(
    BIO_KEYS.flatMap((k) => {
      const v = decodeBio(k, bio?.[k]);
      return v === undefined ? [] : [[k, v]];
    }),
  );

export const ImageKind = z.enum(['photo', 'hero']);
export type ImageKind = z.infer<typeof ImageKind>;

const UPLOAD_SOURCE = /^data\/uploads\/\w[\w.-]*$/;

export const ImageSource = z.union([z.url({ protocol: /^https?$/ }), z.string().regex(UPLOAD_SOURCE)]);
export type ImageSource = z.infer<typeof ImageSource>;

export const isUploadSource = (source: string) => UPLOAD_SOURCE.test(source);

export const imageSlot = (id: string, kind: ImageKind) => `${id}${kind === 'hero' ? '-hero' : ''}`;

export const imageAssetPath = (id: string, kind: ImageKind) => `/assets/players/${imageSlot(id, kind)}.webp`;

export const BioFieldKey = z.templateLiteral(['bio.', BioKey]);
export type BioFieldKey = z.infer<typeof BioFieldKey>;

export const FramingKey = z.enum(['heroFocus', 'heroFlip', 'photoCrop', 'photoFlip']);
export type FramingKey = z.infer<typeof FramingKey>;

export const FRAMING_OF = {
  hero: { focus: 'heroFocus', flip: 'heroFlip' },
  photo: { focus: 'photoCrop', flip: 'photoFlip' },
} as const satisfies Record<ImageKind, { focus: FramingKey; flip: FramingKey }>;

export const NAME_KEY = 'name';
const NAME_KEYS = [NAME_KEY] as const;

export const FieldKey = z.union([z.literal(NAME_KEY), ImageKind, FramingKey, BioFieldKey]);
export type FieldKey = z.infer<typeof FieldKey>;

export const DEFAULT_SOURCE = 'user';

const PlayerId = z.string().regex(/^\d+$/);
const Text = z.string().trim().min(1);
const IsoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const DisplayName = z
  .string()
  .transform(cleanName)
  .superRefine((v, ctx) => {
    const issue = nameIssue(v);
    if (issue) ctx.addIssue({ code: 'custom', message: issue });
  });

export const Provenance = z.object({ source: Text, asOf: IsoDay.optional() });
export type Provenance = z.infer<typeof Provenance>;

export const PlayerOverride = z.looseObject({
  name: DisplayName.optional(),
  photo: ImageSource.optional(),
  hero: ImageSource.optional(),
  heroFocus: Focus.optional(),
  heroFlip: z.boolean().optional(),
  photoCrop: PhotoCrop.optional(),
  photoFlip: z.boolean().optional(),
  bio: z
    .partialRecord(BioKey, z.union([z.string(), z.number()]))
    .transform(decodeAllBio)
    .optional(),
  source: z.string().optional(),
  asOf: z.string().optional(),
  notes: z.string().optional(),
  meta: z.partialRecord(FieldKey, Provenance).optional(),
});
export type PlayerOverride = z.infer<typeof PlayerOverride>;

export const OverridesFile = z.looseObject({ players: z.record(z.string(), PlayerOverride).default({}) });
export type OverridesFile = z.infer<typeof OverridesFile>;

export const AdminPlayer = z.object({
  id: z.string(),
  name: z.string(),
  cc: z.string(),
  photo: z.string().nullable(),
  hero: z.string().nullable(),
  lastPlayed: z.string(),
  rank: z.number().nullable(),
  rankEvent: EventCode.nullable(),
  events: z.array(EventCode),
  bio: z.record(z.string(), z.union([z.string(), z.number()])),
  override: PlayerOverride.nullable(),
});
export type AdminPlayer = z.infer<typeof AdminPlayer>;

export const AdminPlayers = z.object({ players: z.array(AdminPlayer) });
export type AdminPlayers = z.infer<typeof AdminPlayers>;

export const SaveResult = z.object({ entry: PlayerOverride.nullable(), exportMs: z.number() });
export type SaveResult = z.infer<typeof SaveResult>;

export const BulkFieldChange = z.object({ field: BioFieldKey, value: Text.nullable() });
export type BulkFieldChange = z.infer<typeof BulkFieldChange>;

export const BulkRequest = z.object({
  ids: z.array(PlayerId).min(1).max(10_000),
  changes: z.array(BulkFieldChange).min(1),
  source: Text.default(DEFAULT_SOURCE),
  asOf: IsoDay.optional(),
});
export type BulkRequest = z.input<typeof BulkRequest>;

export const BulkResult = z.object({
  entries: z.record(z.string(), PlayerOverride.nullable()),
  changed: z.number(),
  exportMs: z.number(),
});
export type BulkResult = z.infer<typeof BulkResult>;

export const ImageRequest = z.object({
  id: PlayerId,
  kind: ImageKind,
  url: ImageSource.optional(),
  flip: z.boolean().default(false),
});
export type ImageRequest = z.input<typeof ImageRequest>;

export const ImageResult = z.object({
  path: z.string(),
  source: z.string(),
  flip: z.boolean(),
  width: z.number(),
  height: z.number(),
  sourceWidth: z.number(),
  sourceHeight: z.number(),
  bytesIn: z.number(),
  bytesOut: z.number(),
});
export type ImageResult = z.infer<typeof ImageResult>;

export const ApiFailure = z.object({ error: z.string() });

export const EquipmentKind = z.enum(['racket', 'string', 'shoes', 'bag']);
export type EquipmentKind = z.infer<typeof EquipmentKind>;

export const Brand = z.object({ id: z.string(), name: z.string(), aliases: z.array(z.string()) });
export type Brand = z.infer<typeof Brand>;

export const BrandInput = z.object({ name: Text, aliases: z.array(Text).default([]) });
export type BrandInput = z.input<typeof BrandInput>;

export const BrandAdded = z.object({ brands: z.array(Brand), brand: Brand, created: z.boolean() });
export type BrandAdded = z.infer<typeof BrandAdded>;

const EquipmentFields = z.object({
  kind: EquipmentKind,
  brandId: Text,
  model: Text,
});

export const EquipmentInput = EquipmentFields;
export type EquipmentInput = z.input<typeof EquipmentInput>;

export const EquipmentRow = EquipmentFields.extend({ id: z.number().nullable(), brand: z.string(), name: z.string() });
export type EquipmentRow = z.infer<typeof EquipmentRow>;

export const EquipmentList = z.object({ rows: z.array(EquipmentRow), brands: z.array(Brand) });
export type EquipmentList = z.infer<typeof EquipmentList>;

export const EquipmentAdded = EquipmentList.extend({ row: EquipmentRow, created: z.boolean() });
export type EquipmentAdded = z.infer<typeof EquipmentAdded>;

const IMAGE_KEYS = ImageKind.options;
const FRAMING_KEYS = FramingKey.options;
const ENTRY_KEYS = new Set<string>([
  NAME_KEY,
  ...IMAGE_KEYS,
  ...FRAMING_KEYS,
  'bio',
  'source',
  'asOf',
  'notes',
  'meta',
]);
const FLIP_ON = 'true';

const byText = (a: string, b: string) => a.localeCompare(b);

export const isNameField = (key: FieldKey): key is typeof NAME_KEY => key === NAME_KEY;

export const isImageField = (key: FieldKey): key is ImageKind => key === 'photo' || key === 'hero';

export const isFramingField = (key: FieldKey): key is FramingKey => (FRAMING_KEYS as readonly string[]).includes(key);

export const isBioFieldKey = (key: FieldKey): key is BioFieldKey => key.startsWith('bio.');

export interface Codec<T> {
  encode(value: T | null | undefined): string;
  decode(value: string | null | undefined): T | null;
}

const numbers = (value: string | null | undefined) => (value ? value.split(',').map(Number) : []);

export const FocusCodec: Codec<Focus> = {
  encode: (f) => (f ? `${f.x},${f.y}` : ''),
  decode: (value) => {
    const [x, y] = numbers(value);
    return Focus.safeParse({ x, y }).data ?? null;
  },
};

export const CropCodec: Codec<PhotoCrop> = {
  encode: (c) => (c ? `${c.x},${c.y},${c.zoom}` : ''),
  decode: (value) => {
    const [x, y, zoom] = numbers(value);
    return PhotoCrop.safeParse({ x, y, zoom }).data ?? null;
  },
};

export const FlipCodec: Codec<boolean> = {
  encode: (flip) => (flip ? FLIP_ON : ''),
  decode: (value) => (value === FLIP_ON ? true : null),
};

const FRAMING_CODECS: Record<FramingKey, Codec<unknown>> = {
  heroFocus: FocusCodec,
  heroFlip: FlipCodec,
  photoCrop: CropCodec,
  photoFlip: FlipCodec,
};

const encodeFraming = (e: PlayerOverride | null | undefined, key: FramingKey) => FRAMING_CODECS[key].encode(e?.[key]);

export const decodeFraming = (key: FramingKey, value: string | null | undefined) =>
  FRAMING_CODECS[key].decode(value) ?? undefined;

export const bioKeyOf = (key: BioFieldKey) => key.slice(4) as BioKey;

export const sameProvenance = (a: Provenance, b: Provenance) =>
  a.source.trim() === b.source.trim() && (a.asOf || undefined) === (b.asOf || undefined);

export const overrideValue = (e: PlayerOverride | null | undefined, key: FieldKey) => {
  if (isNameField(key)) return e?.name ?? '';
  if (isImageField(key)) return e?.[key] ?? '';
  if (isFramingField(key)) return encodeFraming(e, key);
  return encodeBio(e?.bio?.[bioKeyOf(key)]);
};

export const provenanceOf = (e: PlayerOverride | null | undefined, key: FieldKey): Provenance =>
  e?.meta?.[key] ?? { source: e?.source || DEFAULT_SOURCE, asOf: e?.asOf };

export const sameOverride = (a: PlayerOverride | null, b: PlayerOverride | null) =>
  JSON.stringify(a) === JSON.stringify(b);

export const overriddenKeys = (e: PlayerOverride | null | undefined): FieldKey[] =>
  e
    ? [
        ...(e.name ? NAME_KEYS : []),
        ...IMAGE_KEYS.filter((k) => e[k]),
        ...FRAMING_KEYS.filter((k) => overrideValue(e, k)),
        ...BIO_KEYS.filter((k) => e.bio?.[k]).map((k) => `bio.${k}` as const),
      ]
    : [];

export const canonicalOverride = (e: PlayerOverride | null | undefined): PlayerOverride | null => {
  const keys = overriddenKeys(e);
  const notes = e?.notes?.trim() ? e.notes : undefined;
  if (!e || (!keys.length && !notes)) return null;
  const live = new Set<string>(keys);
  const bio = Object.entries(decodeAllBio(e.bio));
  const meta = Object.entries(e.meta ?? {})
    .filter(([k]) => live.has(k))
    .sort(([a], [b]) => byText(a, b));
  const extra = Object.keys(e)
    .filter((k) => !ENTRY_KEYS.has(k))
    .sort(byText);
  return {
    ...(e.name && { name: e.name }),
    ...(e.photo && { photo: e.photo }),
    ...(e.hero && { hero: e.hero }),
    ...Object.fromEntries(
      FRAMING_KEYS.flatMap((k) => {
        const value = encodeFraming(e, k);
        return value ? [[k, decodeFraming(k, value)]] : [];
      }),
    ),
    ...(bio.length && { bio: Object.fromEntries(bio) }),
    ...(e.source !== undefined && { source: e.source }),
    ...(e.asOf !== undefined && { asOf: e.asOf }),
    ...(notes && { notes }),
    ...(meta.length && { meta: Object.fromEntries(meta) }),
    ...Object.fromEntries(extra.map((k) => [k, e[k]])),
  };
};

export const withField = (
  e: PlayerOverride | null | undefined,
  key: FieldKey,
  value: string | null,
  provenance: Provenance,
): PlayerOverride | null => {
  const next: PlayerOverride = { ...e };
  const bio = { ...e?.bio };
  const meta = { ...e?.meta };
  delete meta[key];
  if (isNameField(key)) next.name = value ?? undefined;
  else if (isImageField(key)) next[key] = value ?? undefined;
  else if (isFramingField(key)) Object.assign(next, { [key]: decodeFraming(key, value) });
  else {
    const decoded = value === null ? undefined : decodeBio(bioKeyOf(key), value);
    if (decoded === undefined) delete bio[bioKeyOf(key)];
    else bio[bioKeyOf(key)] = decoded;
  }
  if (value !== null) {
    const alone = overriddenKeys(e).every((k) => k === key);
    if (next.source === undefined && alone) Object.assign(next, provenance);
    else if (next.source === undefined || !sameProvenance(provenance, { source: next.source, asOf: next.asOf }))
      meta[key] = provenance;
  }
  return canonicalOverride({ ...next, bio, meta });
};

export const setOverride = (file: OverridesFile, id: string, entry: PlayerOverride | null): OverridesFile => {
  const players = { ...file.players };
  if (entry) players[id] = entry;
  else delete players[id];
  return { ...file, players };
};
