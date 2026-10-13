import { z } from 'zod';

import { LevelsParam, listParam, type MapPoint } from '~/api/schemas';
import type { Level, Player, Tournament } from '~/types';

export type { MapPoint };

export interface PinSpot extends MapPoint {
  t: Tournament;
  ax: number;
  ay: number;
  moved: boolean;
}

export interface SeasonFocus {
  live: Tournament | undefined;
  next: Tournament | undefined;
  finals: Tournament | undefined;
  spot: Tournament | undefined;
  focus: Tournament | undefined;
}

export interface SeasonStat {
  key: string;
  value: string;
  unit?: string;
  label: string;
  gold?: boolean;
}

export const SeasonStatus = z.enum(['done', 'up', 'next']);
export type SeasonStatus = z.infer<typeof SeasonStatus>;

export const AboutSearch = z.object({ levels: LevelsParam, status: listParam(SeasonStatus) });
export type AboutSearch = z.infer<typeof AboutSearch>;

export type OnActive = (code: string | null) => void;

export interface TierSummary {
  level: Level;
  events: Tournament[];
  prize: string;
  share: number;
  points: number;
  draw: string;
}

export interface NationTitles {
  cc: string;
  titles: number;
  share: number;
}

export interface TitlesSummary {
  events: number;
  titles: number;
  nations: NationTitles[];
  leaders: Player[];
  most: number;
}
