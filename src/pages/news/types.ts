import type { NewsStory } from '~/utils/news';

export interface MonthGroup {
  key: string;
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

export type RegisterSection = (id: string, el: HTMLElement | null) => void;
