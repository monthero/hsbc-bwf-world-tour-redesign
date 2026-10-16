import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parsePoFile } from '@lingui/format-po';

import config from '../lingui.config.ts';

type GenerateId = (message: string, context?: string) => string;

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = config.sourceLocale ?? 'en';
const CATALOG = path.join(ROOT, `src/locales/${SOURCE}.po`);
const ASSETS = path.join(ROOT, 'dist/assets');
const COMPILED_ID = /\bid:([`"'])([\w-]{6})\1/g;
const LOCALE_CHUNK = new RegExp(`^(${config.locales.join('|')})-[\\w-]+\\.js$`);
const SNIPPET_BEFORE = 140;
const SNIPPET_AFTER = 60;
const MAX_LISTED = 4;

const generatorPath = createRequire(import.meta.resolve('@lingui/core')).resolve(
  '@lingui/message-utils/generateMessageId',
);
const { generateMessageId } = (await import(pathToFileURL(generatorPath).href)) as { generateMessageId: GenerateId };

const po = parsePoFile(await fs.readFile(CATALOG, 'utf8'));
const known = new Set(
  po.items
    .filter((item) => item.msgid && !item.obsolete)
    .map((item) => generateMessageId(item.msgid, item.msgctxt ?? '')),
);

const files = (await fs.readdir(ASSETS)).filter((file) => file.endsWith('.js') && !LOCALE_CHUNK.test(file));
const unknown = new Map<string, string[]>();
let scanned = 0;

for (const file of files) {
  const code = await fs.readFile(path.join(ASSETS, file), 'utf8');
  for (const match of code.matchAll(COMPILED_ID)) {
    scanned++;
    const id = match[2];
    if (known.has(id)) continue;
    const snippet = code
      .slice(Math.max(0, match.index - SNIPPET_BEFORE), match.index + SNIPPET_AFTER)
      .replaceAll(/\s+/g, ' ');
    unknown.set(id, [...(unknown.get(id) ?? []), `${file}: …${snippet}…`]);
  }
}

console.log(
  `${known.size} ids in ${path.relative(ROOT, CATALOG)}, ${scanned} compiled ids in ${files.length} files, ${unknown.size} not in the catalog`,
);

if (unknown.size) {
  for (const [id, places] of unknown) {
    console.log(`\n${id} (${places.length}×)`);
    for (const place of places.slice(0, MAX_LISTED)) console.log(`  ${place}`);
    if (places.length > MAX_LISTED) console.log(`  …and ${places.length - MAX_LISTED} more`);
  }
  console.log(
    '\nThese ids were compiled into the build but match no message in the catalog, so the UI would show the raw id. Run pnpm i18n:extract if the messages are new. Otherwise check for plural() or select() inside a message: property, and write the ICU string in msg() with the values passed at render time instead.',
  );
  process.exit(1);
}
