import { createContext } from 'react';

import type { TournamentLookup } from '~/utils/news';

export const LookupContext = createContext<TournamentLookup | undefined>(undefined);
