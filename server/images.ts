import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import sharp from 'sharp';

import { dayjs, nowIso } from '../scripts/sync/dates.ts';
import { prettyJson } from '../scripts/sync/util.ts';
import {
  imageAssetPath,
  imageSlot,
  isUploadSource,
  type ImageKind,
  type ImageResult,
} from '../src/pages/admin/schema.ts';
import { formatBytes } from '../src/utils/bytes.ts';
import { errorMessage, HttpError, readText, writeAtomic } from './http.ts';

const MAX_BYTES = 40 * 1024 * 1024;
const TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 4;
const MAX_WAIT_MS = 20_000;
const BASE_DELAY_MS = 1_000;
const MAX_REDIRECTS = 5;
const BOT_UA = 'bwf-tracker-dev/0.1 (personal project)';
const WIKIMEDIA_UA = 'hsbc-bwf-world-tour-redesign/1.0 (+https://github.com/monthero/hsbc-bwf-world-tour-redesign)';
const WIKIMEDIA_GAP_MS = 1_500;
const BROWSER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const ACCEPT = 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5';
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);
const REFUSED = new Set([401, 403]);
const STALE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'avif', 'tif', 'tiff'];
const OUTPUT_EXT = 'webp';
const HASH_LENGTH = 16;

const ENCODING: Record<ImageKind, { width: number; height?: number; quality: number }> = {
  hero: { width: 2400, quality: 80 },
  photo: { width: 800, height: 800, quality: 82 },
};

type Profile = 'bot' | 'browser' | 'referer';

interface HostRule {
  test: RegExp;
  profiles: readonly Profile[];
  referer?: string;
  ipv4?: boolean;
  ua?: string;
  gapMs?: number;
}

const HOST_RULES: readonly HostRule[] = [
  { test: /(^|\.)wikimedia\.org$/, profiles: ['bot'], ipv4: true, ua: WIKIMEDIA_UA, gapMs: WIKIMEDIA_GAP_MS },
  { test: /(^|\.)badmintoneurope\.com$/, profiles: ['bot', 'browser'] },
  { test: /(^|\.)bwfbadminton\.com$/, profiles: ['bot', 'referer'], referer: 'https://bwfbadminton.com/' },
];

const DEFAULT_RULE: HostRule = { test: /./, profiles: ['browser', 'referer', 'bot'] };

interface Fetched {
  status: number;
  header: (name: string) => string;
  body: AsyncIterable<Uint8Array> | null;
  cancel: () => void;
}

type Attempt =
  | { kind: 'ok'; data: Buffer }
  | { kind: 'retry'; reason: string; wait: number | null; status?: number }
  | { kind: 'refused'; status: number };

interface Original {
  data: Buffer;
  url: string | null;
  cached: boolean;
}

interface OriginalMeta {
  url: string | null;
  bytes: number;
  at: string;
  encoded?: string;
}

const ruleFor = (host: string) => HOST_RULES.find((r) => r.test.test(host)) ?? DEFAULT_RULE;

const headersFor = (profile: Profile, url: URL, rule: HostRule): Record<string, string> => ({
  'user-agent': profile === 'bot' ? (rule.ua ?? BOT_UA) : BROWSER_UA,
  accept: ACCEPT,
  ...(profile === 'referer' && { referer: rule.referer ?? `${url.origin}/` }),
});

const viaFetch = async (url: URL, headers: Record<string, string>, signal: AbortSignal): Promise<Fetched> => {
  const res = await fetch(url, { headers, redirect: 'follow', signal });
  return {
    status: res.status,
    header: (name) => res.headers.get(name) ?? '',
    body: res.body,
    cancel: () => void res.body?.cancel().catch(() => undefined),
  };
};

const viaIpv4 = (url: URL, headers: Record<string, string>, signal: AbortSignal, hops = 0): Promise<Fetched> =>
  new Promise((resolve, reject) => {
    const req = https.get(url, { headers, family: 4, signal }, (res) => {
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location && hops < MAX_REDIRECTS) {
        res.resume();
        resolve(viaIpv4(new URL(location, url), headers, signal, hops + 1));
        return;
      }
      resolve({
        status,
        header: (name) => String(res.headers[name] ?? ''),
        body: res,
        cancel: () => res.destroy(),
      });
    });
    req.on('error', reject);
  });

const backoff = (attempt: number) => BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 400;

const retryAfter = (value: string) => {
  if (!value) return null;
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const at = dayjs(value);
  return at.isValid() ? Math.max(0, at.diff(dayjs())) : null;
};

const tooBig = (bytes: number) =>
  new HttpError(413, `Image is ${formatBytes(bytes)}, over the ${formatBytes(MAX_BYTES)} download limit`);

const networkReason = (e: unknown) => {
  if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError'))
    return `timed out after ${TIMEOUT_MS / 1000} s`;
  const cause = e instanceof Error ? (e.cause as { code?: string } | undefined) : undefined;
  return cause?.code ?? errorMessage(e);
};

const readLimited = async (res: Fetched) => {
  const declared = Number(res.header('content-length') || 0);
  if (declared > MAX_BYTES) {
    res.cancel();
    throw tooBig(declared);
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of res.body ?? []) {
    size += chunk.length;
    if (size > MAX_BYTES) {
      res.cancel();
      throw tooBig(size);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const lastRequest = new Map<string, number>();
const blockedUntil = new Map<string, number>();

const pace = async (host: string, gapMs = 0) => {
  const wait = (lastRequest.get(host) ?? 0) + gapMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest.set(host, Date.now());
};

const attempt = async (url: URL, rule: HostRule, profile: Profile): Promise<Attempt> => {
  const transport = rule.ipv4 ? viaIpv4 : viaFetch;
  await pace(url.hostname, rule.gapMs);
  let res: Fetched;
  try {
    res = await transport(url, headersFor(profile, url, rule), AbortSignal.timeout(TIMEOUT_MS));
  } catch (e) {
    return { kind: 'retry', reason: networkReason(e), wait: null };
  }
  if (REFUSED.has(res.status)) {
    res.cancel();
    return { kind: 'refused', status: res.status };
  }
  if (RETRYABLE.has(res.status)) {
    res.cancel();
    return {
      kind: 'retry',
      reason: `HTTP ${res.status}`,
      wait: retryAfter(res.header('retry-after')),
      status: res.status,
    };
  }
  if (res.status < 200 || res.status >= 300) {
    res.cancel();
    throw new HttpError(502, `${url.hostname} answered HTTP ${res.status}${res.status === 404 ? ' (not found)' : ''}`);
  }
  const type = res.header('content-type').split(';')[0]?.trim().toLowerCase() ?? '';
  if (type.startsWith('text/')) {
    res.cancel();
    throw new HttpError(415, `${url.hostname} sent a web page (${type}), not an image; it probably blocks hotlinking`);
  }
  try {
    const data = await readLimited(res);
    if (!data.length) throw new HttpError(502, `${url.hostname} sent an empty file`);
    return { kind: 'ok', data };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    return { kind: 'retry', reason: networkReason(e), wait: null };
  }
};

const rateLimited = (host: string, wait: number | null) =>
  new HttpError(
    429,
    `${host} is rate-limiting downloads (HTTP 429${wait ? `, retry after ${Math.ceil(wait / 1000)} s` : ''}). Try again later.`,
  );

const download = async (raw: string) => {
  const url = new URL(raw);
  const rule = ruleFor(url.hostname);
  const blocked = (blockedUntil.get(url.hostname) ?? 0) - Date.now();
  if (blocked > 0) throw rateLimited(url.hostname, blocked);
  const refused: string[] = [];
  for (const profile of rule.profiles) {
    for (let n = 1; ; n++) {
      const result = await attempt(url, rule, profile);
      if (result.kind === 'ok') return result.data;
      if (result.kind === 'refused') {
        refused.push(`${result.status} as ${profile}`);
        break;
      }
      const wait = result.wait ?? backoff(n);
      if (n >= MAX_ATTEMPTS || wait > MAX_WAIT_MS) {
        if (wait > MAX_WAIT_MS) blockedUntil.set(url.hostname, Date.now() + wait);
        if (result.status === 429) throw rateLimited(url.hostname, result.wait);
        throw new HttpError(504, `${url.hostname}: ${result.reason} after ${n} ${n === 1 ? 'try' : 'tries'}`);
      }
      await sleep(wait);
    }
  }
  throw new HttpError(
    403,
    `${url.hostname} refused the download (${refused.join(', ')}); it probably blocks hotlinking`,
  );
};

const encodedHash = (source: string | null, kind: ImageKind, flip: boolean) =>
  createHash('sha256')
    .update(JSON.stringify([source, kind, ENCODING[kind], OUTPUT_EXT, flip]))
    .digest('hex')
    .slice(0, HASH_LENGTH);

const encode = async (input: Buffer, kind: ImageKind, flip: boolean) => {
  const spec = ENCODING[kind];
  const { data, info } = await sharp(input, { failOn: 'none' })
    .autoOrient()
    .resize({ width: spec.width, height: spec.height, fit: 'inside', withoutEnlargement: true })
    .flop(flip)
    .webp({ quality: spec.quality })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const probe = async (data: Buffer) => {
  try {
    const meta = await sharp(data, { failOn: 'none' }).metadata();
    const turned = (meta.orientation ?? 1) >= 5;
    return { width: (turned ? meta.height : meta.width) ?? 0, height: (turned ? meta.width : meta.height) ?? 0 };
  } catch {
    throw new HttpError(415, 'The file is not a readable image');
  }
};

export const createImageStore = (root: string) => {
  const publicDir = path.join(root, 'public');
  const originalsDir = path.join(root, 'data/cache/originals');

  const outputFile = (id: string, kind: ImageKind) => path.join(publicDir, imageAssetPath(id, kind));
  const originalFile = (id: string, kind: ImageKind) => path.join(originalsDir, `${imageSlot(id, kind)}.orig`);
  const metaFile = (id: string, kind: ImageKind) => path.join(originalsDir, `${imageSlot(id, kind)}.json`);

  const readMeta = async (id: string, kind: ImageKind) =>
    JSON.parse(await readText(metaFile(id, kind), () => 'null')) as OriginalMeta | null;

  const readOriginal = async (id: string, kind: ImageKind): Promise<Original | null> => {
    const [data, meta] = await Promise.all([fs.readFile(originalFile(id, kind)).catch(() => null), readMeta(id, kind)]);
    return data && { data, url: meta?.url ?? null, cached: true };
  };

  const readUpload = (source: string) =>
    fs.readFile(path.join(root, source)).catch(() => {
      throw new HttpError(404, `${source} is missing`);
    });

  const originalFor = async (id: string, kind: ImageKind, url: string | null, offline: boolean): Promise<Original> => {
    const cached = await readOriginal(id, kind);
    if (cached && (url === null || cached.url === url)) return cached;
    if (url === null) throw new HttpError(404, 'No cached original for this image; fetch it again from its URL');
    if (isUploadSource(url)) return { data: await readUpload(url), url, cached: false };
    if (offline) throw new HttpError(503, `No cached original for ${url} (offline)`);
    return { data: await download(url), url, cached: false };
  };

  const cacheOriginal = async (id: string, kind: ImageKind, original: Original, encoded: string) => {
    await fs.mkdir(originalsDir, { recursive: true });
    const meta: OriginalMeta = { url: original.url, bytes: original.data.length, at: nowIso(), encoded };
    if (!original.cached) await writeAtomic(originalFile(id, kind), original.data);
    await writeAtomic(metaFile(id, kind), prettyJson(meta));
  };

  const removeStale = (id: string, kind: ImageKind) =>
    Promise.all(
      STALE_EXTS.map((ext) =>
        fs.rm(path.join(path.dirname(outputFile(id, kind)), `${imageSlot(id, kind)}.${ext}`), { force: true }),
      ),
    );

  const write = async (
    id: string,
    kind: ImageKind,
    original: Original,
    source: { width: number; height: number },
    flip: boolean,
  ): Promise<ImageResult> => {
    const out = await encode(original.data, kind, flip);
    const file = outputFile(id, kind);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await writeAtomic(file, out.data);
    await removeStale(id, kind);
    await cacheOriginal(id, kind, original, encodedHash(original.url, kind, flip));
    return {
      path: imageAssetPath(id, kind),
      source: original.url ?? '',
      flip,
      width: out.width,
      height: out.height,
      sourceWidth: source.width,
      sourceHeight: source.height,
      bytesIn: original.data.length,
      bytesOut: out.data.length,
    };
  };

  const store = async (id: string, kinds: readonly ImageKind[], url: string | null, flip = false, offline = false) => {
    const [first = 'hero'] = kinds;
    const original = await originalFor(id, first, url, offline);
    const source = await probe(original.data);
    return Promise.all(
      kinds.map((kind) => write(id, kind, kind === first ? original : { ...original, cached: false }, source, flip)),
    );
  };

  const isFresh = async (id: string, kind: ImageKind, source: string, flip: boolean) => {
    const meta = await readMeta(id, kind);
    if (meta?.url !== source || meta.encoded !== encodedHash(source, kind, flip)) return false;
    return fs.stat(outputFile(id, kind)).then(
      (s) => s.isFile(),
      () => false,
    );
  };

  const ensure = async (id: string, kind: ImageKind, source: string, flip: boolean, offline: boolean) => {
    if (await isFresh(id, kind, source, flip)) return null;
    const [image] = await store(id, [kind], source, flip, offline);
    return image ?? null;
  };

  const pruneDir = async (dir: string, keep: ReadonlySet<string>) => {
    const names = await fs.readdir(dir).catch((): string[] => []);
    const stale = names.filter((name) => !keep.has(path.parse(name).name));
    await Promise.all(stale.map((name) => fs.rm(path.join(dir, name), { force: true })));
    return stale.length;
  };

  const prune = async (keep: ReadonlySet<string>) => {
    const [built] = await Promise.all([
      pruneDir(path.dirname(outputFile('0', 'photo')), keep),
      pruneDir(originalsDir, keep),
    ]);
    return built;
  };

  return { store, ensure, prune };
};
