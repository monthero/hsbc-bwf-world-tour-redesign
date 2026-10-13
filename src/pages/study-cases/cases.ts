import type { LinkProps } from '@tanstack/react-router';

export interface StudyCase {
  to: LinkProps['to'];
  title: string;
  summary: string;
}

export const STUDY_CASES: readonly StudyCase[] = [];
