import type { NewsBlock, NewsRun } from '~/api/schemas'
import type { Player, PlayerDirectory } from '~/types'
import { toPlayer } from '~/utils/names'

import { WORDS_PER_MINUTE } from './constants'

export const runsText = (runs: readonly NewsRun[]) => runs.map((r) => r.text).join('')

const blockText = (b: NewsBlock) => {
  if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') return runsText(b.runs)
  if (b.type === 'list') return b.items.map(runsText).join(' ')
  return ''
}

export const readMinutes = (blocks: readonly NewsBlock[]) => {
  const words = blocks.map(blockText).join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export interface FeaturedPlayer {
  player: Player
  photo: string | null
}

export const featuredPlayers = (ids: readonly string[], directory: PlayerDirectory | undefined): FeaturedPlayer[] => {
  if (!directory) return []
  return [...new Set(ids)]
    .map((id) => directory.get(id))
    .filter((r) => r !== undefined)
    .map((r) => ({ player: toPlayer(r.name, r.cc, r.id), photo: r.photo ?? null }))
}
