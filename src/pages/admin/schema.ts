import { z } from 'zod';

import { EditionRef, EventCode, Focus, IsoDay, MonthKey, PhotoCrop } from '../../api/schemas.ts';
import { parseHeightCm, parsePlays, parseTension, tidySpaces } from '../../utils/parse.ts';
import { cleanName, nameIssue } from '../../utils/surname.ts';

const BIO_KEYS = [
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
  'racketNote',
  'tension',
  'tensionNote',
  'string',
  'shoes',
  'shoesNote',
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

const BIO_PARSERS: Partial<Record<BioKey, (value: unknown) => BioValue | null>> = {
  height: parseHeightCm,
  plays: parsePlays,
  tension: parseTension,
};

export const decodeBio = (key: BioKey, value: unknown): BioValue | undefined => {
  const parse = BIO_PARSERS[key];
  if (parse) return parse(value) ?? undefined;
  const text = typeof value === 'string' || typeof value === 'number' ? tidySpaces(String(value)) : '';
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

const ALLOWED_IMAGE_HOSTS = [
  'wikimedia.org',
  'bwfbadminton.com',
  'olympics.com',
  'yonex.com',
  'yonex.co.uk',
  'yonex.cz',
  'yonex.com.tw',
  'badmintoneurope.com',
  'badminton.dk',
  'badminton.or.jp',
  'german-open-badminton.de',
  'hkbadmintonassn.org.hk',
  'pbsi.id',
  'usabadminton.org',
  'djarumbadminton.com',
];

const ALLOWED_IMAGE_PREFIXES = ['https://res.cloudinary.com/badminton/'];

const hostOf = (source: string) => {
  try {
    return new URL(source).hostname.toLowerCase();
  } catch {
    return null;
  }
};

export const imageSourceIssue = (source: string) => {
  const host = hostOf(source);
  const allowed =
    !!host &&
    (ALLOWED_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ||
      ALLOWED_IMAGE_PREFIXES.some((p) => source.startsWith(p)));
  return allowed
    ? null
    : `Blocked: images from ${host ?? 'this source'} aren't allowed (copyright risk). Use Wikimedia, BWF, a federation or a brand site.`;
};

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
export const RETIRED_KEY = 'retired';
const TOP_KEYS = [NAME_KEY, RETIRED_KEY] as const;
export type TopKey = (typeof TOP_KEYS)[number];

export const FieldKey = z.union([z.enum(TOP_KEYS), ImageKind, FramingKey, BioFieldKey]);
export type FieldKey = z.infer<typeof FieldKey>;

const PlayerId = z.string().regex(/^\d+$/);
const Text = z.string().trim().min(1);
const DisplayName = z
  .string()
  .transform(cleanName)
  .superRefine((v, ctx) => {
    const issue = nameIssue(v);
    if (issue) ctx.addIssue({ code: 'custom', message: issue });
  });

export const PlayerOverride = z.looseObject({
  name: DisplayName.optional(),
  retired: MonthKey.optional(),
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
  notes: z.string().optional(),
});
export type PlayerOverride = z.infer<typeof PlayerOverride>;

export const OverridesFile = z.looseObject({ players: z.record(z.string(), PlayerOverride).default({}) });
export type OverridesFile = z.infer<typeof OverridesFile>;

export const RetirementNews = z.object({ id: z.string(), title: z.string(), date: IsoDay, inTitle: z.boolean() });
export type RetirementNews = z.infer<typeof RetirementNews>;

export const AdminPartner = z.object({ id: z.string(), event: EventCode, matches: z.number(), last: IsoDay });
export type AdminPartner = z.infer<typeof AdminPartner>;

export const AdminPlayer = z.object({
  id: z.string(),
  name: z.string(),
  cc: z.string(),
  photo: z.string().nullable(),
  hero: z.string().nullable(),
  lastPlayed: z.string(),
  lastTournament: EditionRef.nullable(),
  retirementNews: z.array(RetirementNews),
  rank: z.number().nullable(),
  rankEvent: EventCode.nullable(),
  events: z.array(EventCode),
  partners: z.array(AdminPartner),
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
});
export type BulkRequest = z.input<typeof BulkRequest>;

export const ImportRow = z.object({ id: PlayerId, changes: z.array(BulkFieldChange).min(1) });
export type ImportRow = z.infer<typeof ImportRow>;

export const ImportRequest = z.object({
  rows: z.array(ImportRow).min(1).max(10_000),
});
export type ImportRequest = z.input<typeof ImportRequest>;

export const CSV_FIELDS = {
  hand: 'bio.plays',
  racket: 'bio.racket',
  racket_extra_info: 'bio.racketNote',
  strings: 'bio.string',
  tension: 'bio.tension',
  tension_extra_info: 'bio.tensionNote',
  shoes: 'bio.shoes',
} as const satisfies Record<string, BioFieldKey>;
export type CsvColumn = keyof typeof CSV_FIELDS;
export const CSV_ID = 'player_id';

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

export const EquipmentKind = z.enum(['racket', 'string', 'shoes']);
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

export const EquipmentRow = EquipmentFields.extend({ id: z.uuidv4(), brand: z.string(), name: z.string() });
export type EquipmentRow = z.infer<typeof EquipmentRow>;

export const EquipmentList = z.object({ rows: z.array(EquipmentRow), brands: z.array(Brand) });
export type EquipmentList = z.infer<typeof EquipmentList>;

export const EquipmentAdded = EquipmentList.extend({ row: EquipmentRow, created: z.boolean() });
export type EquipmentAdded = z.infer<typeof EquipmentAdded>;

const IMAGE_KEYS = ImageKind.options;
const FRAMING_KEYS = FramingKey.options;
const ENTRY_KEYS = new Set<string>([...TOP_KEYS, ...IMAGE_KEYS, ...FRAMING_KEYS, 'bio', 'notes']);
const FLIP_ON = 'true';

const byText = (a: string, b: string) => a.localeCompare(b);

export const isNameField = (key: FieldKey): key is typeof NAME_KEY => key === NAME_KEY;

export const isTopField = (key: FieldKey): key is TopKey => (TOP_KEYS as readonly string[]).includes(key);

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

export const overrideValue = (e: PlayerOverride | null | undefined, key: FieldKey) => {
  if (isTopField(key) || isImageField(key)) return e?.[key] ?? '';
  if (isFramingField(key)) return encodeFraming(e, key);
  return encodeBio(e?.bio?.[bioKeyOf(key)]);
};

export const sameOverride = (a: PlayerOverride | null, b: PlayerOverride | null) =>
  JSON.stringify(a) === JSON.stringify(b);

export const overriddenKeys = (e: PlayerOverride | null | undefined): FieldKey[] =>
  e
    ? [
        ...TOP_KEYS.filter((k) => e[k]),
        ...IMAGE_KEYS.filter((k) => e[k]),
        ...FRAMING_KEYS.filter((k) => overrideValue(e, k)),
        ...BIO_KEYS.filter((k) => e.bio?.[k]).map((k) => `bio.${k}` as const),
      ]
    : [];

export const canonicalOverride = (e: PlayerOverride | null | undefined): PlayerOverride | null => {
  const keys = overriddenKeys(e);
  const notes = e?.notes?.trim() ? e.notes : undefined;
  if (!e || (!keys.length && !notes)) return null;
  const bio = Object.entries(decodeAllBio(e.bio));
  const extra = Object.keys(e)
    .filter((k) => !ENTRY_KEYS.has(k))
    .sort(byText);
  return {
    ...(e.name && { name: e.name }),
    ...(e.retired && { retired: e.retired }),
    ...(e.photo && { photo: e.photo }),
    ...(e.hero && { hero: e.hero }),
    ...Object.fromEntries(
      FRAMING_KEYS.flatMap((k) => {
        const value = encodeFraming(e, k);
        return value ? [[k, decodeFraming(k, value)]] : [];
      }),
    ),
    ...(bio.length && { bio: Object.fromEntries(bio) }),
    ...(notes && { notes }),
    ...Object.fromEntries(extra.map((k) => [k, e[k]])),
  };
};

export const withField = (
  e: PlayerOverride | null | undefined,
  key: FieldKey,
  value: string | null,
): PlayerOverride | null => {
  const next: PlayerOverride = { ...e };
  const bio = { ...e?.bio };
  if (isTopField(key) || isImageField(key)) next[key] = value ?? undefined;
  else if (isFramingField(key)) Object.assign(next, { [key]: decodeFraming(key, value) });
  else {
    const decoded = value === null ? undefined : decodeBio(bioKeyOf(key), value);
    if (decoded === undefined) delete bio[bioKeyOf(key)];
    else bio[bioKeyOf(key)] = decoded;
  }
  return canonicalOverride({ ...next, bio });
};

export const setOverride = (file: OverridesFile, id: string, entry: PlayerOverride | null): OverridesFile => {
  const players = { ...file.players };
  if (entry) players[id] = entry;
  else delete players[id];
  return { ...file, players };
};
