import { createContext, type ReactNode } from 'react';

import type { EventCode, Player, Tournament } from '~/types';

export const TournamentContext = createContext<Tournament | undefined>(undefined);

export type RenderPlayerHover = (id: string, anchor: ReactNode) => ReactNode;

export const PlayerHoverContext = createContext<RenderPlayerHover | null>(null);

export type RankOf = (players: readonly Player[], ev: EventCode) => number;

export const TournamentRankContext = createContext<RankOf | null>(null);
