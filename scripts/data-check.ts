import path from 'node:path';

import { creditIssues, readCredits } from './sync/credits.ts';
import { dataIssues, readCatalog } from './sync/equipment.ts';
import { readOverrides } from './sync/util.ts';

const DATA_DIR = path.resolve(import.meta.dirname, '../data');

const overrides = readOverrides(path.join(DATA_DIR, 'overrides.json'));
const issues = [...dataIssues(readCatalog(DATA_DIR), overrides), ...creditIssues(overrides, readCredits(DATA_DIR))];

if (issues.length) {
  console.error(`Curated data has ${issues.length} problems:\n${issues.join('\n')}`);
  process.exit(1);
}
console.log('Curated data is consistent');
