import path from 'node:path';

import { refreshCredits } from './sync/credits.ts';
import { readOverrides } from './sync/util.ts';

const DATA_DIR = path.resolve(import.meta.dirname, '../data');

const { found, total } = await refreshCredits(DATA_DIR, readOverrides(path.join(DATA_DIR, 'overrides.json')));
console.log(`Credits: ${found} of ${total} Wikimedia images`);
