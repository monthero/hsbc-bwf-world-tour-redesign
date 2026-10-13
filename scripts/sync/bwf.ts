import { query } from './http.ts'

export const CATEGORIES = [22, 23, 24, 25, 26] as const

export const WORLD = 2
export const RACE = 9

export const EVENTS = ['MS', 'WS', 'MD', 'WD', 'XD'] as const
export type EventCode = (typeof EVENTS)[number]

export const WORLD_CATEGORIES: Record<number, EventCode> = { 6: 'MS', 7: 'WS', 8: 'MD', 9: 'WD', 10: 'XD' }
export const RACE_CATEGORIES: Record<number, EventCode> = { 57: 'MS', 58: 'WS', 59: 'MD', 60: 'WD', 61: 'XD' }

export interface ApiTournament {
  id: number
  code: string
  name: string
  start_date: string
  end_date: string
  location: string
  country: string
  prize_money: string | null
  category: string
  logo: string | null
  header_url_tpl: string | null
  status: { code: string } | null
  is_etihad?: boolean
}

export interface ApiCalendar {
  results: { tournaments: ApiTournament[] }[]
}

export interface ApiPlayer {
  id: string | number
  nameDisplay: string
  countryCode: string | null
  slug?: string | null
  avatar?: { thumbnailUrl?: string | null } | null
}

export interface ApiMatch {
  id: number
  code: string | null
  isTeamMatch: boolean | null
  eventName: string | null
  roundName: string | null
  drawName: string | null
  matchTime: string | null
  matchStatus: string
  courtCode: string | null
  courtIndex: number | null
  locationName: string | null
  winner: number | null
  duration: number | null
  scoreStatus: number | null
  scoreStatusValue: string | null
  team1seed: string | number | null
  team2seed: string | number | null
  team1: { players: ApiPlayer[] } | null
  team2: { players: ApiPlayer[] } | null
  score: { home: number; away: number }[] | null
}

export interface ApiSummary {
  results: {
    id: number
    slug: string | null
    name_display: string
    date_of_birth: string | null
    nationality: string | null
    avatar: { url_cloudinary: string | null } | null
    hero_image: { url_cloudinary_large: string | null } | null
    bio_model: Record<string, string | null> | null
  } | null
}

export interface ApiBio {
  height?: string | null
  languages?: string | null
  age?: number | null
  hand?: string | null
  current_residence?: string | null
  prize_money?: string | null
  qa?: Record<string, string | null> | null
}

export interface ApiPublication {
  id: number
  year: number
  week: number
  date: string
}

export interface ApiRankingPlayer {
  name_display_bold: string | null
  avatar: { url_cloudinary: string | null } | null
}

export interface ApiRankingRow {
  ranking_category_id: number
  player1_id: number
  player2_id: number | null
  rank: number
  rank_previous: number | null
  points: string
  tournaments?: number | null
  player1_model?: ApiRankingPlayer | null
  player2_model?: ApiRankingPlayer | null
  p1_country_model?: { name: string | null } | null
  p2_country_model?: { name: string | null } | null
}

export interface ApiRankingTable {
  results: { data: ApiRankingRow[]; last_page: number }
}

export interface ApiHistoryRow extends ApiRankingRow {
  ranking_publication_id: number
  player_1_name: string | null
  player_2_name: string | null
  highest_rank: number | null
  total_weeks: number | null
  date: string | null
  rankingBreakdowns: {
    year: number
    week: number
    result: number
    points: number
    ranking_calc: number
    tournament: { name: string } | null
  }[]
}

export interface ApiRankingInfo {
  id: number
  name: string
}

export interface ApiHistory {
  data: ApiHistoryRow[]
}

export interface ApiTournamentDetail {
  results: { tournament_series_id: number | null; venue_name: string | null } | null
}

export interface ApiMatchStat {
  results: {
    team1_rallies_won: number | null
    team2_rallies_won: number | null
    team1_game_points: number | null
    team2_game_points: number | null
  } | null
}

const SRC = 'bwf-sync'

export const calendarPath = (year: number) =>
  `${query('vue-grouped-year-tournaments', { year, state: 'all', _src: SRC })}&${CATEGORIES.map((c) => `category%5B%5D=${c}`).join('&')}`

export const dayMatchesPath = (code: string, day: string) =>
  query('tournaments/day-matches', { tournamentCode: code, date: day, order: 2, court: 0 })

export const summaryPath = (id: string) => query('vue-player-summary', { playerId: id, isPara: false, _src: SRC })

export const bioPath = (id: string) => query('vue-player-bio', { activeTab: 1, playerId: id, _src: SRC })

export const publicationsPath = (ranking: number) => query('vue-rankingweek', { rankId: ranking, _src: SRC })

export const rankingTablePath = (
  ranking: number,
  category: number,
  publication: number,
  doubles: boolean,
  page: number,
  size = 1000,
) =>
  query('vue-rankingtable', {
    rankId: ranking,
    catId: category,
    publicationId: publication,
    doubles,
    searchKey: '',
    pageKey: size,
    page,
    drawCount: 1,
    _src: SRC,
  })

export const rankingsListPrefix = 'player/rankings?playerId='

export const rankingsListPath = (id: string) => query('player/rankings', { playerId: id })

export const historyPrefix = (id: string) => query('player/rankings/history', { playerId: id, rankingId: WORLD })

export const historyPath = (id: string, publication: number) => `${historyPrefix(id)}&year=&_pub=${publication}`

export const detailPath = (tmtId: number) => query('vue-tournament-detail', { tmtId, _src: SRC })

export const matchStatPath = (tmtId: number, code: string) =>
  query('match-center/vue-match-stat', { tmtId, matchId: code, _src: SRC })
