import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { parsePoFile } from '@lingui/format-po';

import config from '../lingui.config.ts';

type Choices = Record<string, Token[]>;
type Token = string | [name: string, type?: string, format?: unknown];
type Compile = (message: string) => Token[];
type Choice = { type: string; keys: Set<string> };
type Shape = { args: Set<string>; choices: Map<string, Choice[]>; tags: string[] };
type Problem = { locale: string; msgid: string; issues: string[] };

const ROOT = path.resolve(import.meta.dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src/locales');
const SOURCE = config.sourceLocale ?? 'en';
const CHOICE_TYPES = new Set(['plural', 'select', 'selectordinal']);
const TAG = /<\/?\d+\s*\/?>/g;
const MAX_LISTED = 10;

const { values } = parseArgs({ options: { 'fail-on-missing': { type: 'boolean', default: false } } });
const failOnMissing = values['fail-on-missing'];

const compilerPath = createRequire(import.meta.resolve('@lingui/core')).resolve('@lingui/message-utils/compileMessage');
const { compileMessageOrThrow } = (await import(pathToFileURL(compilerPath).href)) as {
  compileMessageOrThrow: Compile;
};

const isChoices = (format: unknown): format is Choices => typeof format === 'object' && format !== null;

const walk = (tokens: Token[], shape: Shape): Shape => {
  for (const token of tokens) {
    if (typeof token === 'string') {
      shape.tags.push(...(token.match(TAG) ?? []).map((tag) => tag.replaceAll(/\s/g, '')));
      continue;
    }
    const [name, type, format] = token;
    shape.args.add(name);
    if (!type || !CHOICE_TYPES.has(type) || !isChoices(format)) continue;
    const keys = Object.keys(format).filter((key) => key !== 'offset');
    shape.choices.set(name, [...(shape.choices.get(name) ?? []), { type, keys: new Set(keys) }]);
    for (const key of keys) walk(format[key] ?? [], shape);
  }
  return shape;
};

const shapeOf = (message: string) =>
  walk(compileMessageOrThrow(message), { args: new Set(), choices: new Map(), tags: [] });

const firstLine = (error: unknown) =>
  error instanceof Error ? error.message.split('\n')[0].replace(/:$/, '') : 'unknown error';

const sortedTags = (shape: Shape) => shape.tags.toSorted((a, b) => a.localeCompare(b)).join('');

const listTags = (shape: Shape) => shape.tags.join('') || 'none';

const compareSelect = (name: string, source: Choice[], target: Choice[]) => {
  const expected = new Set(source.flatMap((choice) => [...choice.keys]));
  return target.flatMap((choice) => [
    ...[...expected].filter((key) => !choice.keys.has(key)).map((key) => `{${name}} select is missing "${key}"`),
    ...[...choice.keys].filter((key) => !expected.has(key)).map((key) => `{${name}} select has unknown "${key}"`),
  ]);
};

const compareShapes = (source: Shape, target: Shape) => {
  const issues = [
    ...[...source.args].filter((name) => !target.args.has(name)).map((name) => `missing {${name}}`),
    ...[...target.args].filter((name) => !source.args.has(name)).map((name) => `unknown {${name}}`),
  ];
  for (const [name, sourceChoices] of source.choices) {
    const targetChoices = target.choices.get(name) ?? [];
    for (const type of new Set(sourceChoices.map((choice) => choice.type))) {
      const matching = targetChoices.filter((choice) => choice.type === type);
      if (!matching.length) issues.push(`{${name}} should be a ${type}`);
      if (type === 'select') issues.push(...compareSelect(name, sourceChoices, matching));
    }
  }
  for (const [name, choices] of target.choices) {
    for (const choice of choices)
      if (!choice.keys.has('other')) issues.push(`{${name}} ${choice.type} is missing "other"`);
  }
  if (sortedTags(source) !== sortedTags(target)) {
    issues.push(`tags ${listTags(target)} should be ${listTags(source)}`);
  }
  return issues;
};

const keyOf = (msgid: string, context: string | null) => (context ? `${context}\u0004${msgid}` : msgid);

const readCatalog = async (locale: string) => {
  const content = await fs.readFile(path.join(LOCALES_DIR, `${locale}.po`), 'utf8').catch(() => '');
  const po = parsePoFile(content);
  const items = po.items.filter((item) => item.msgid && !item.obsolete);
  return new Map(
    items.map((item) => [keyOf(item.msgid, item.msgctxt), { msgid: item.msgid, msgstr: item.msgstr.join('') }]),
  );
};

const invalid = (error: unknown) => [`invalid ICU: ${firstLine(error)}`];

const POSITIONAL = /^\d+$/;

const positionalIssue = (names: string[]) =>
  `positional ${names.map((name) => '{' + name + '}').join(', ')}: put the value in a named variable before passing it to the macro`;

const source = await readCatalog(SOURCE);
const problems: Problem[] = [];
const shapes = new Map<string, Shape>();
for (const [key, { msgid }] of source) {
  try {
    const shape = shapeOf(msgid);
    shapes.set(key, shape);
    const positional = [...shape.args].filter((name) => POSITIONAL.test(name));
    if (positional.length) problems.push({ locale: SOURCE, msgid, issues: [positionalIssue(positional)] });
  } catch (error) {
    problems.push({ locale: SOURCE, msgid, issues: invalid(error) });
  }
}

const targets = config.locales.filter((locale) => locale !== SOURCE);
const catalogs = await Promise.all(targets.map(readCatalog));
const width = Math.max(...targets.map((locale) => locale.length));
const missing = new Map<string, string[]>();

console.log(`Translations of ${source.size} messages from ${SOURCE}:`);
for (const [index, locale] of targets.entries()) {
  const catalog = catalogs[index];
  const empty: string[] = [];
  let broken = 0;
  for (const [key, { msgid }] of source) {
    const translation = catalog.get(key)?.msgstr ?? '';
    const shape = shapes.get(key);
    if (!translation.trim()) empty.push(msgid);
    if (!translation.trim() || !shape) continue;
    let issues: string[];
    try {
      issues = compareShapes(shape, shapeOf(translation));
    } catch (error) {
      issues = invalid(error);
    }
    if (!issues.length) continue;
    broken++;
    problems.push({ locale, msgid, issues });
  }
  missing.set(locale, empty);
  const parts = [
    `${source.size - empty.length}/${source.size} translated`,
    ...(empty.length ? [`${empty.length} missing`] : []),
    ...(broken ? [`${broken} broken`] : []),
  ];
  console.log(`  ${locale.padEnd(width)}  ${parts.join(', ')}`);
}

if (problems.length) {
  console.log(`\nBroken translations (${problems.length}):`);
  for (const { locale, msgid, issues } of problems) {
    console.log(`  ${locale}: ${JSON.stringify(msgid)}\n    ${issues.join('; ')}`);
  }
  console.log(
    `\nFix ${SOURCE} problems in the source code, then run pnpm i18n:extract. Fix the others in src/locales/{locale}.po so placeholders, plurals and tags match the English text.`,
  );
} else {
  console.log('\nNo broken translations.');
}

const totalMissing = [...missing.values()].reduce((sum, ids) => sum + ids.length, 0);
if (totalMissing && failOnMissing) {
  console.log(`\nMissing translations (${totalMissing}):`);
  for (const [locale, ids] of missing) {
    if (!ids.length) continue;
    console.log(`  ${locale}:`);
    for (const id of ids.slice(0, MAX_LISTED)) console.log(`    ${JSON.stringify(id)}`);
    if (ids.length > MAX_LISTED) console.log(`    …and ${ids.length - MAX_LISTED} more`);
  }
  console.log('\nTranslate these in src/locales/{locale}.po.');
}
if (totalMissing && !failOnMissing) {
  console.log(`\n${totalMissing} translations are missing; pass --fail-on-missing to treat that as an error.`);
}

if (problems.length || (totalMissing && failOnMissing)) process.exit(1);
