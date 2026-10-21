import path from 'node:path';

import { dataIssues, readCatalog } from './sync/equipment.ts';
import { readOverrides } from './sync/util.ts';

const DATA_DIR = path.resolve(import.meta.dirname, '../data');

const issues = dataIssues(readCatalog(DATA_DIR), readOverrides(path.join(DATA_DIR, 'overrides.json')));

if (issues.length) {
  console.error(`Curated data has ${issues.length} problems:\n${issues.join('\n')}`);
  process.exit(1);
}
console.log('Curated data is consistent');
