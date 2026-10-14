import type { MedalKind } from '~/types';

const MEDAL_BY_RESULT: Partial<Record<number, MedalKind>> = { 1: 'gold', 2: 'silver', 3: 'bronze' };

export const medalOfResult = (n: number): MedalKind | null => MEDAL_BY_RESULT[n] ?? null;
