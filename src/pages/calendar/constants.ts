import type { SegmentedOption } from '~/components/ui'

import type { StatusFilter } from './types'

export const STATUS_OPTIONS: readonly SegmentedOption<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'done', label: 'Completed' },
  { value: 'up', label: 'Remaining' },
]

export const PROVISIONAL_TIP = 'Dates and venues are provisional until BWF confirms them'

export const COMPACT_HEIGHT = { desktop: 54, mobile: 48 } as const

export const AUTO_SCROLL_DELAYS = [0, 300, 1000] as const

export const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
