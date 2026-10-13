import { createContext, type ReactNode } from 'react';

import type { Tournament } from '~/types';

export const TournamentContext = createContext<Tournament | undefined>(undefined);

export type RenderPlayerHover = (id: string, anchor: ReactNode) => ReactNode;

export const PlayerHoverContext = createContext<RenderPlayerHover | null>(null);
