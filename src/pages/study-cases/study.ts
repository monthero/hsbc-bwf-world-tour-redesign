import type { SegmentedOption } from '~/components/ui';

export type DesktopWidth = '460' | '700';

export const DESKTOP_WIDTHS: readonly SegmentedOption<DesktopWidth>[] = [
  { value: '460', label: '3-up · 460px' },
  { value: '700', label: '2-up · 700px' },
];

export const DESKTOP_COLUMNS: Record<DesktopWidth, number> = { '460': 3, '700': 2 };

export const STUDY_GRID_GAP = 10;

export const MOBILE_WIDTH = 390;

export interface StudyOption {
  key: string;
  label: string;
}
