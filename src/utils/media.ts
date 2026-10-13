import type { MediaItem } from '~/api/schemas'
import type { Match, Player, Team } from '~/types'

import { foldText } from './names'

export interface MatchMedia {
  full?: MediaItem
  highlights?: MediaItem
}

export interface LinkedMedia {
  byMatch: ReadonlyMap<string, MatchMedia>
  matchOf: ReadonlyMap<string, Match>
}

const YT_WATCH = 'https://www.youtube.com/watch?v='
const YT_THUMB = 'https://i.ytimg.com/vi/'

export const watchUrl = (id: string) => `${YT_WATCH}${id}`

export const thumbUrl = (id: string) => `${YT_THUMB}${id}/mqdefault.jpg`

const pad = (n: number) => String(n).padStart(2, '0')

export const durationLabel = (sec: number | null) => {
  if (!sec) return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const words = (s: string) =>
  foldText(s)
    .split(/[^a-z]+/)
    .filter(Boolean)

const nameHit = (title: readonly string[], p: Player) => {
  const own = words(p.name)
  const surname = words(p.surname)
  if (title.every((w) => own.includes(w))) return title.some((w) => surname.includes(w)) ? 2 : 1
  const overlap = title.filter((w) => own.includes(w)).length
  const extraGiven = surname.length > 0 && surname.every((w) => title.includes(w)) && overlap >= 2
  return extraGiven && title.length - overlap <= 1 ? 1 : 0
}

const teamHit = (names: readonly string[][], team: Team) => {
  const [a, b] = team.players
  const [x, y] = names
  if (names.length !== team.players.length || !a || !x) return 0
  if (!b || !y) return nameHit(x, a)
  return Math.max(Math.min(nameHit(x, a), nameHit(y, b)), Math.min(nameHit(x, b), nameHit(y, a)))
}

const matchHit = (sides: readonly [string[][], string[][]], m: Match) => {
  const [s0, s1] = sides
  const [t0, t1] = m.teams
  return Math.max(Math.min(teamHit(s0, t0), teamHit(s1, t1)), Math.min(teamHit(s0, t1), teamHit(s1, t0)))
}

const bestMatch = (item: MediaItem, matches: readonly Match[]) => {
  if (!item.sides) return null
  const sides: [string[][], string[][]] = [item.sides[0].map(words), item.sides[1].map(words)]
  let best = 0
  let found: Match[] = []
  for (const m of matches) {
    const score = matchHit(sides, m)
    if (score > best) {
      best = score
      found = [m]
    } else if (score === best && score > 0) found.push(m)
  }
  const narrowed = found.length > 1 && item.round ? found.filter((m) => m.round === item.round) : found
  return narrowed.length === 1 ? (narrowed[0] ?? null) : null
}

const SLOT: Partial<Record<MediaItem['kind'], keyof MatchMedia>> = { full_match: 'full', highlights: 'highlights' }

export const linkMedia = (items: readonly MediaItem[], matches: readonly Match[]): LinkedMedia => {
  const byMatch = new Map<string, MatchMedia>()
  const matchOf = new Map<string, Match>()
  for (const item of items) {
    const slot = SLOT[item.kind]
    const m = slot ? bestMatch(item, matches) : null
    if (!slot || !m) continue
    matchOf.set(item.id, m)
    const entry = byMatch.get(m.id) ?? {}
    entry[slot] ??= item
    byMatch.set(m.id, entry)
  }
  return { byMatch, matchOf }
}
