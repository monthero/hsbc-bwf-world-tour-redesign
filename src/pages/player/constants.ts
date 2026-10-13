import type { TabItem } from '~/components/ui'
import type { MedalKind } from '~/types'

import type { PlayerTab } from './types'

export const PLAYER_TAB_ITEMS: readonly TabItem<PlayerTab>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'matches', label: 'Matches' },
  { value: 'results', label: 'Results' },
  { value: 'rankings', label: 'Rankings' },
]

export const RESULT_LABELS: Record<number, string> = {
  1: 'Winner',
  2: 'Runner-up',
  3: 'Semi-final',
  5: 'Quarter-final',
  9: 'R16',
  17: 'R32',
  33: 'R64',
  65: 'R128',
}

export const LOSS_RESULT: Record<string, number> = { F: 2, SF: 3, QF: 5, R16: 9, R32: 17, R64: 33 }

export const RESULT_TAGS: Record<number, string> = { 1: 'W', 2: 'F', 3: 'SF' }

export const MEDAL_TILES: readonly { kind: MedalKind; label: string }[] = [
  { kind: 'gold', label: 'Titles' },
  { kind: 'silver', label: 'Runner-up' },
  { kind: 'bronze', label: 'Semi-finals' },
]

export const RECENT_LIMIT = 10

export const TITLE_LIMIT = 8

export const RESULTS_TIP = 'Results counting toward the current world ranking'

export const PARTNER_LIMIT = 6

export const PARTNER_MIN_MATCHES = 3
