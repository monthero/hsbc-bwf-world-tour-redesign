import { EventCode, type NewsItem } from '~/api/schemas'
import { EVENT_NAMES, REST_DAY } from '~/constants'
import type {
  DrawSlot,
  EntryListing,
  Match,
  MedalKind,
  Player,
  PlayerDirectory,
  Series,
  SideResult,
  Team,
  Tournament,
  TournamentDay,
  TournamentSchedule,
  TournamentStatus,
} from '~/types'
import { date, formatDateRange } from '~/utils/dates'
import { plural } from '~/utils/format'
import {
  formatGames,
  isDoubles,
  isMainDraw,
  latestByTeam,
  noteLabel,
  opposite,
  sideStatus,
  teamLabel,
  winnerSide,
  winnerTeam,
} from '~/utils/matches'
import { toPlayer } from '~/utils/names'
import { formatPrize } from '~/utils/tournaments'

import { isBracketMatch } from './components/draw/bracket'
import { DAY_ROUNDS, DRAW_SEEDS, PODIUM_PLACES, PODIUM_PRIZES, PRIZE_BASE } from './constants'
import type { TabAvailability, TournamentTab } from './types'

const DEFAULT_TAB: Record<TournamentStatus, TournamentTab> = {
  done: 'podium',
  live: 'matches',
  up: 'overview',
  cancelled: 'overview',
}

export const resolveTab = (
  tab: TournamentTab | undefined,
  available: TabAvailability | null,
  status: TournamentStatus,
): TournamentTab => {
  const t = tab ?? DEFAULT_TAB[status]
  return !available || available[t] ? t : 'overview'
}

export const tabAvailability = (
  schedule: TournamentSchedule,
  draw: readonly DrawSlot[] | null,
  entries: readonly EntryListing[] | undefined,
  news: readonly NewsItem[] | undefined,
): TabAvailability => {
  const matches = schedule.matches.length > 0
  const bracket = !!draw || schedule.matches.some(isBracketMatch)
  return {
    overview: true,
    matches,
    draw: bracket,
    players: matches || bracket || !!entries?.length,
    podium: matches,
    media: matches,
    news: !!news?.length,
  }
}

export const mergeDraw = (draw: readonly DrawSlot[], matches: readonly Match[]): DrawSlot[] | null => {
  if (!draw.some((s) => s.match.teams.some((t) => t.players.length > 0))) return null
  const byId = new Map(matches.map((m) => [m.id, m]))
  return draw.map(({ match, slot }) => ({ match: byId.get(match.id) ?? match, slot }))
}

export type DayState = 'done' | 'now' | 'up'

export interface DaySlot {
  key: string
  day: TournamentDay
  rest: string | null
  live: boolean
}

const restLabel = (run: readonly TournamentDay[]) => {
  const first = run[0]?.shortLabel ?? ''
  return run.length > 1 ? `Rest days · ${first} – ${run.at(-1)?.shortLabel ?? ''}` : `${REST_DAY} · ${first}`
}

export const daySlots = (days: readonly TournamentDay[]): DaySlot[] => {
  const runs: TournamentDay[][] = []
  for (const d of days) {
    const run = runs.at(-1)
    if (run && d.isRest && run[0]?.isRest) run.push(d)
    else runs.push([d])
  }
  return runs.flatMap((run) => {
    const day = run[0]
    if (!day) return []
    return [{ key: day.date, day, rest: day.isRest ? restLabel(run) : null, live: run.some((d) => d.isLive) }]
  })
}

export interface TimelineDay {
  key: string
  label: string
  num: string
  rest: string | null
  state: DayState
  long: string
  short: string
}

const dayState = (i: number, todayIndex: number, status: TournamentStatus): DayState => {
  if (status === 'done' || i < todayIndex) return 'done'
  return i === todayIndex && status === 'live' ? 'now' : 'up'
}

const REST_ROUNDS = { long: REST_DAY, short: REST_DAY }

const dayRounds = (day: TournamentDay) => {
  if (day.isRest) return REST_ROUNDS
  const labels = [...new Set(day.rounds.filter(Boolean).map((r) => DAY_ROUNDS[r] ?? { long: r, short: r }))]
  const short = labels.map((l) => l.short).join(' · ')
  return { long: labels.length === 1 ? (labels[0]?.long ?? '') : short, short }
}

export const buildTimeline = (status: TournamentStatus, schedule: TournamentSchedule): TimelineDay[] =>
  daySlots(schedule.days).map(({ key, day, rest, live }) => ({
    key,
    label: day.shortLabel,
    num: day.dayNum,
    rest,
    state: dayState(live ? schedule.todayIndex : day.index, schedule.todayIndex, status),
    ...dayRounds(day),
  }))

export interface ChampionItem {
  event: EventCode
  players: Player[]
  photos?: (string | null)[]
  score?: string
}

const finalOf = (matches: Match[], event: EventCode) =>
  matches.find((m) => m.event === event && m.round === 'F' && winnerSide(m) !== null)

export const buildChampions = (schedule: TournamentSchedule): ChampionItem[] =>
  EventCode.options.flatMap((event) => {
    const fm = finalOf(schedule.matches, event)
    const w = fm && winnerTeam(fm)
    return w ? [{ event, players: w.players }] : []
  })

export interface PastYear {
  key: string
  year: number
  meta: string
  items: ChampionItem[]
}

export const buildPastWinners = (t: Tournament, series: Series, dir: PlayerDirectory | undefined): PastYear[] =>
  series.editions
    .filter((e) => e.year < t.year && !e.cancelled && e.finals.length > 0)
    .map((e) => ({
      key: e.code,
      year: e.year,
      meta: `${formatDateRange(date(e.start), date(e.end), { pad: false })} · ${e.city}, ${e.country}`,
      items: EventCode.options.flatMap((event) => {
        const f = e.finals.find((x) => x.event === event)
        if (!f) return []
        const losers = f.losers.map((l) => toPlayer(l.name, l.cc, l.id).surname).join(' / ')
        return [
          {
            event,
            players: f.winners.map((w) => toPlayer(w.name, w.cc, w.id)),
            photos: f.winners.map((w) => dir?.get(w.id)?.photo ?? null),
            score: `${f.note ? `${f.note} · ` : ''}vs. ${losers} · ${formatGames(f.games)}`,
          },
        ]
      }),
    }))

export interface PodiumPlace {
  label: string
  medal: MedalKind
  prize: string
  teams: Team[] | null
}

export interface SeedEntry {
  key: string
  seed: number
  team: Team | null
  tone: SideResult
  status: string
  tip: string
}

export interface PodiumEvent {
  event: EventCode
  name: string
  when: string
  places: PodiumPlace[]
  seedsNote: string
  seeds: SeedEntry[]
}

const seedTip = (m: Match) => {
  const w = winnerSide(m)
  if (w === null) return ''
  const l = opposite(w)
  if (!m.teams[l].players.length) return ''
  return [
    `${teamLabel(m.teams[w], ' & ')} beat ${teamLabel(m.teams[l], ' & ')}`,
    m.round,
    formatGames(m.games, w),
    noteLabel(m.note, 'long').toLowerCase(),
  ]
    .filter(Boolean)
    .join(' · ')
}

export const buildPodium = (t: Tournament, schedule: TournamentSchedule): PodiumEvent[] => {
  const latest = [...latestByTeam(schedule.matches).values()]
  const scale = t.prize / PRIZE_BASE
  const lastDay = schedule.days.at(-1)
  return EventCode.options.map((event) => {
    const prizes = isDoubles(event) ? PODIUM_PRIZES.doubles : PODIUM_PRIZES.singles
    const fm = finalOf(schedule.matches, event)
    const fw = fm ? winnerSide(fm) : null
    const semis = schedule.matches.filter((m) => m.event === event && m.round === 'SF' && winnerSide(m) !== null)
    const day = (fm && schedule.days[fm.dayIndex]) ?? lastDay
    const who = [
      fm && fw !== null ? [fm.teams[fw]] : null,
      fm && fw !== null ? [fm.teams[opposite(fw)]] : null,
      semis.length ? semis.map((m) => m.teams[opposite(winnerSide(m) ?? 0)]) : null,
    ]
    const found = latest
      .filter((x) => x.match.event === event && x.team.seed && isMainDraw(x.match))
      .map(({ match, team, side }): SeedEntry => {
        const st = sideStatus(match, side)
        return {
          key: `${match.id}-${side}`,
          seed: team.seed ?? 0,
          team,
          tone: st.tone,
          status: st.label,
          tip: st.tone === 'won' || st.tone === 'lost' ? seedTip(match) : '',
        }
      })
    const seen = new Set(found.map((s) => s.seed))
    const missing = found.length
      ? Array.from({ length: DRAW_SEEDS }, (_, i) => i + 1)
          .filter((n) => !seen.has(n))
          .map((n): SeedEntry => ({ key: `missing-${n}`, seed: n, team: null, tone: 'lost', status: '', tip: '' }))
      : []
    const seeds = [...found, ...missing].sort((a, b) => a.seed - b.seed)
    return {
      event,
      name: EVENT_NAMES[event],
      when: day ? `Final · ${day.shortLabel}` : 'Final',
      places: PODIUM_PLACES.map((p, i) => ({
        ...p,
        prize: formatPrize(Math.round((prizes[i] ?? 0) * scale)),
        teams: who[i] ?? null,
      })),
      seedsNote: fm ? plural(seeds.length, 'seed') : 'In action today',
      seeds,
    }
  })
}
