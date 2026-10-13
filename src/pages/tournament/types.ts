import { z } from 'zod';

import { EventCode } from '~/api/schemas';
import type { DrawSlot, EntryListing, Tournament, TournamentSchedule } from '~/types';

export const TournamentTab = z.enum(['overview', 'matches', 'draw', 'players', 'podium', 'media', 'news']);
export type TournamentTab = z.infer<typeof TournamentTab>;

export const PlayersView = z.enum(['country', 'discipline']);
export type PlayersView = z.infer<typeof PlayersView>;

export const TournamentSearch = z.object({
  tab: TournamentTab.optional().catch(undefined),
  day: z.number().int().min(0).optional().catch(undefined),
  events: z.array(EventCode).optional().catch(undefined),
  courts: z.array(z.number().int()).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  following: z.boolean().optional().catch(undefined),
  match: z.string().optional().catch(undefined),
  draw: EventCode.optional().catch(undefined),
  round: z.number().int().min(0).max(4).optional().catch(undefined),
  pev: EventCode.optional().catch(undefined),
  top10: z.boolean().optional().catch(undefined),
  pby: PlayersView.optional().catch(undefined),
});

export type TournamentSearch = z.infer<typeof TournamentSearch>;

export type TabAvailability = Record<TournamentTab, boolean>;

export interface TabProps {
  tournament: Tournament;
  schedule: TournamentSchedule;
  draw: DrawSlot[] | null;
  entries: EntryListing[] | undefined;
}
