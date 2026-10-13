import { z } from 'zod';

import type { NewsStory } from '~/utils/news';

export const NewsSearch = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional()
    .catch(undefined),
});

export type NewsSearch = z.infer<typeof NewsSearch>;

export interface MonthGroup {
  key: string;
  order: number;
  id: string;
  name: string;
  year: number;
  total: number;
  stories: NewsStory[] | undefined;
  failed: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  short: string;
  count?: number;
}

export interface ArchiveMonth {
  key: string;
  label: string;
  short: string;
  count: number;
}

export interface ArchiveYear {
  year: number;
  total: number;
  months: (ArchiveMonth | null)[];
}

interface RowBase {
  key: string;
  group: MonthGroup;
}

export type ArchiveRow =
  | (RowBase & { kind: 'head' | 'failed' | 'subscribe' })
  | (RowBase & { kind: 'stories'; stories: NewsStory[] | undefined; size: number; first: boolean; last: boolean });

export type RegisterSection = (id: string, el: HTMLElement | null) => void;

export type Probe = (y: number) => string | undefined;

export type PickMonth = (key: string) => void;
