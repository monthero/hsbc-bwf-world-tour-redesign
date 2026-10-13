import type { MedalKind } from '~/types'

export const MEDAL_META: Record<MedalKind, { color: string; text: string }> = {
  gold: { color: 'var(--bwf-gold)', text: 'var(--bwf-gold-text)' },
  silver: { color: 'var(--bwf-silver)', text: 'var(--bwf-silver-text)' },
  bronze: { color: 'var(--bwf-bronze)', text: 'var(--bwf-bronze-text)' },
}

const MEDAL_BY_RESULT: Partial<Record<number, MedalKind>> = { 1: 'gold', 2: 'silver', 3: 'bronze' }

export const medalOfResult = (n: number): MedalKind | null => MEDAL_BY_RESULT[n] ?? null
