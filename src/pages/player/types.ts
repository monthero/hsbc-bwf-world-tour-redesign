import { z } from 'zod';

import { EventCode, type Level } from '~/api/schemas';
import type { MedalKind, Player, PlayerMatch, Tournament } from '~/types';

export const PlayerTab = z.enum(['overview', 'matches', 'results', 'rankings', 'media']);
export type PlayerTab = z.infer<typeof PlayerTab>;

export const PlayerSearch = z.object({
  tab: PlayerTab.optional().catch(undefined),
  from: z.string().optional().catch(undefined),
  season: z.number().int().optional().catch(undefined),
  event: EventCode.optional().catch(undefined),
});

export type PlayerSearch = z.infer<typeof PlayerSearch>;

export interface BreakdownItem {
  key: string;
  name: string;
  year: number;
  week: number;
  result: number;
  points: number;
  counted: boolean;
}

export interface ResultGroup {
  key: string;
  ev: EventCode;
  partner: Player | null;
  items: BreakdownItem[];
}

export interface HistoryRow {
  key: string;
  partner: Player | null;
  rank: number;
  best: number;
  points: number;
  date: string;
  last: string | null;
  first: string | null;
  weeks: number | null;
  current: boolean;
}

export interface RankPoint {
  key: string;
  date: string;
  time: number;
  rank: number;
  points: number;
  partner: Player | null;
}

export interface HistoryGroup {
  ev: EventCode;
  rows: HistoryRow[];
  series: RankPoint[];
}

export interface DisciplineHigh {
  rank: number;
  date: string | null;
  weeks: number | null;
  partner: Player | null;
}

export interface DisciplineView {
  ev: EventCode;
  active: boolean;
  lead: HistoryRow | undefined;
  high: DisciplineHigh | null;
  first: string | null;
  last: string | null;
  weeksRanked: number;
  series: RankPoint[];
  partners: HistoryRow[];
}

export interface HistoryView {
  groups: HistoryGroup[];
  results: ResultGroup[];
}

export type MedalCounts = Record<MedalKind, number>;

export interface SeasonView {
  year: number;
  matches: PlayerMatch[];
  wins: number;
  losses: number;
  titles: number;
  best: number | null;
}

export interface CareerView {
  seasons: SeasonView[];
  wins: number;
  losses: number;
  counts: MedalCounts;
  titles: PlayerMatch[];
}

export interface EventRun {
  key: string;
  event: EventCode;
  partner: Player | null;
  perMatch: boolean;
  result: number | null;
  matches: PlayerMatch[];
}

export interface TournamentRuns {
  key: string;
  tournament: Tournament;
  runs: EventRun[];
}

export interface PartnerRow {
  key: string;
  event: EventCode;
  partner: Player;
  first: number;
  last: number;
  matches: number;
  wins: number;
  losses: number;
  titles: number;
  finals: number;
}

export interface CareerHigh {
  rank: number;
  weeks: number | null;
  partner: Player | null;
}

export interface WinLoss {
  wins: number;
  losses: number;
}

export interface RivalRow extends WinLoss {
  key: string;
  players: Player[];
  matches: number;
}

export interface LevelRecord extends WinLoss {
  level: Level;
}

export interface SeasonBreakdown {
  levels: LevelRecord[];
  deciders: WinLoss;
  avgMin: number;
}
