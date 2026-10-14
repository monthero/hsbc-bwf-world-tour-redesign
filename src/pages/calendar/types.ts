import type { RefCallback } from 'react';
import { z } from 'zod';

import { LevelsParam } from '~/api/schemas';
import { FIRST_SEASON, SEASON_YEAR } from '~/constants';
import type { Tournament } from '~/types';

export const CalendarSearch = z.object({
  year: z
    .number()
    .int()
    .min(FIRST_SEASON)
    .max(SEASON_YEAR + 1)
    .optional()
    .catch(undefined),
  levels: LevelsParam,
  status: z.enum(['done', 'up']).optional().catch(undefined),
});

export type CalendarSearch = z.infer<typeof CalendarSearch>;

export type StatusFilter = 'all' | 'done' | 'up';

type MonthTone = 'past' | 'current' | 'future';

export type JumpDirection = 'up' | 'down' | null;

export type AnchorRef = RefCallback<HTMLElement>;

export interface MonthGroup {
  month: number;
  name: string;
  items: Tournament[];
  tone: MonthTone;
  progress: number;
  muted: boolean;
}
