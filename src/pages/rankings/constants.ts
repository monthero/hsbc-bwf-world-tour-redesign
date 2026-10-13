import type { SegmentedOption } from '~/components/ui'
import type { RankingKind } from '~/types'

export const DEFAULT_KIND: RankingKind = 'world'

export const KIND_OPTIONS: readonly SegmentedOption<RankingKind>[] = [
  { value: 'world', label: 'World', tip: 'BWF World Rankings' },
  { value: 'race', label: 'Race to Finals', tip: 'HSBC BWF World Tour Finals race' },
]

export const PODIUM_MEDALS = ['gold', 'silver', 'bronze'] as const

export const SEARCH_DEBOUNCE_MS = 250
