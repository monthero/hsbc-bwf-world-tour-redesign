import { z } from 'zod'

export const EventCode = z.enum(['MS', 'WS', 'MD', 'WD', 'XD'])
export type EventCode = z.infer<typeof EventCode>

export const EntryStage = z.enum(['main', 'qual', 'reserve', 'withdrawn'])
export type EntryStage = z.infer<typeof EntryStage>

export const Level = z.enum(['1000', '750', '500', '300', 'Finals'])
export type Level = z.infer<typeof Level>

export const Continent = z.enum(['Europe', 'Asia', 'Americas', 'Oceania', 'Africa', 'Other'])
export type Continent = z.infer<typeof Continent>

const NullableString = z.string().nullable()
const NullableNumber = z.number().nullable()
const OptionalString = z.string().optional()
const Pair = z.tuple([z.number(), z.number()])

const Person = z.object({ id: z.string(), name: z.string(), cc: z.string() })

const Percent = z.number().min(0).max(100)

export const Focus = z.object({ x: Percent, y: Percent })
export type Focus = z.infer<typeof Focus>

export const ZOOM_MIN = 1
export const ZOOM_MAX = 4

export const PhotoCrop = Focus.extend({ zoom: z.number().min(ZOOM_MIN).max(ZOOM_MAX) })
export type PhotoCrop = z.infer<typeof PhotoCrop>

const Team = z.object({ seed: NullableNumber, players: z.array(Person) })

export const MapPoint = z.object({ x: z.number(), y: z.number() })
export type MapPoint = z.infer<typeof MapPoint>

export const CalendarEventDto = z.object({
  code: z.string(),
  tmtId: NullableNumber,
  year: z.number(),
  slug: z.string(),
  series: z.string(),
  name: z.string(),
  title: z.string(),
  subtitle: NullableString,
  city: z.string(),
  country: z.string(),
  venue: NullableString,
  level: Level,
  start: z.string(),
  end: z.string(),
  prize: z.number(),
  logoVersion: z.string(),
  headerVersion: z.string(),
  cancelled: z.boolean(),
  archived: z.boolean(),
  map: MapPoint.nullable(),
  etihad: z.boolean(),
  winners: z.array(z.object({ event: EventCode, players: z.array(Person) })),
})
export type CalendarEventDto = z.infer<typeof CalendarEventDto>

export const Calendar = z.object({ year: z.number(), events: z.array(CalendarEventDto) })
export type Calendar = z.infer<typeof Calendar>

export const Seasons = z.object({
  current: z.number(),
  seasons: z.array(z.object({ year: z.number(), events: z.number(), completed: z.number() })),
})
export type Seasons = z.infer<typeof Seasons>

export const MatchDto = z.object({
  court: z.number(),
  time: z.string(),
  event: EventCode,
  round: z.string(),
  group: OptionalString,
  status: z.enum(['F', 'P', 'N']),
  winner: z.number(),
  teams: z.tuple([Team, Team]),
  games: z.array(Pair),
  durationMin: z.number(),
  serve: z.number(),
  note: NullableString,
  code: z.string().optional(),
  pause: NullableString.optional(),
  lastPoint: z.number().optional(),
})
export type MatchDto = z.infer<typeof MatchDto>

export const TournamentMatches = z.object({
  code: z.string(),
  asOf: z.string(),
  days: z.record(z.string(), z.array(MatchDto)),
  plannedDays: z.record(z.string(), z.object({ rounds: z.array(z.string()), count: z.number() })),
})
export type TournamentMatches = z.infer<typeof TournamentMatches>

export const PlayerBio = z.object({
  age: z.number().optional(),
  born: OptionalString,
  height: z.number().int().positive().optional(),
  plays: OptionalString,
  birthplace: OptionalString,
  residence: OptionalString,
  languages: OptionalString,
  natTeam: OptionalString,
  prize: OptionalString,
  ambition: OptionalString,
  racket: OptionalString,
  string: OptionalString,
  shoes: OptionalString,
  bag: OptionalString,
  debut: OptionalString,
  coach: OptionalString,
  club: OptionalString,
  yonex: OptionalString,
  nickname: OptionalString,
  started: OptionalString,
  achievements: OptionalString,
  idol: OptionalString,
  instagram: OptionalString,
  facebook: OptionalString,
})
export type PlayerBio = z.infer<typeof PlayerBio>

export const CurrentRank = z.object({
  ev: EventCode,
  r: NullableNumber,
  pr: NullableNumber,
  w: z.string(),
  wid: z.string().default(''),
  hi: NullableNumber,
  hw: z.string(),
  hwid: z.string().default(''),
})
export type CurrentRank = z.infer<typeof CurrentRank>

export const PlayerRecord = z.object({
  name: z.string(),
  aka: z.string().optional(),
  cc: z.string(),
  photo: OptionalString,
  photoCrop: PhotoCrop.optional(),
  ranks: z.array(CurrentRank).optional(),
})
export type PlayerRecord = z.infer<typeof PlayerRecord>

export const PlayersData = z.object({
  rankingsWeek: z.string(),
  players: z.record(z.string(), PlayerRecord),
})
export type PlayersData = z.infer<typeof PlayersData>

export const CareerMatchDto = MatchDto.extend({ tournament: z.string(), day: z.string() })
export type CareerMatchDto = z.infer<typeof CareerMatchDto>

export const PlayerProfileDto = z.object({
  id: z.string(),
  name: z.string(),
  cc: z.string(),
  photo: NullableString,
  hero: NullableString,
  heroFocus: Focus.nullish(),
  slug: NullableString,
  bio: PlayerBio,
  matches: z.array(CareerMatchDto),
})
export type PlayerProfileDto = z.infer<typeof PlayerProfileDto>

const RankingBreakdown = z.object({
  tournament: z.string(),
  year: z.number(),
  week: z.number(),
  result: z.number(),
  points: z.number(),
  counted: z.boolean(),
})

const RankingEntry = z.object({
  event: EventCode.nullable(),
  publicationId: z.number(),
  player1Id: NullableNumber,
  player2Id: NullableNumber,
  player1Name: NullableString,
  player2Name: NullableString,
  rank: z.number(),
  rankPrevious: NullableNumber,
  highestRank: z.number(),
  totalWeeks: NullableNumber,
  date: NullableString,
  points: z.number(),
  breakdown: z.array(RankingBreakdown),
})

export const RankingHistory = z.object({
  id: z.string(),
  name: z.string(),
  publicationId: z.number(),
  history: z.array(RankingEntry),
})
export type RankingHistory = z.infer<typeof RankingHistory>

const RaceRank = z.object({
  ev: EventCode,
  r: z.number(),
  pr: NullableNumber,
  n: z.string(),
  w: z.string(),
  pts: z.number(),
})

export const RaceRankings = z.object({ week: OptionalString, players: z.record(z.string(), z.array(RaceRank)) })
export type RaceRankings = z.infer<typeof RaceRankings>

export const RankingKind = z.enum(['world', 'race'])
export type RankingKind = z.infer<typeof RankingKind>

export const RankingPlayer = z.object({
  id: z.string(),
  name: z.string(),
  cc: z.string(),
  photo: NullableString,
  known: z.boolean(),
})
export type RankingPlayer = z.infer<typeof RankingPlayer>

export const RankingRow = z.object({
  rank: z.number(),
  prev: NullableNumber,
  points: z.number(),
  tournaments: NullableNumber,
  players: z.array(RankingPlayer),
})
export type RankingRow = z.infer<typeof RankingRow>

export const RankingTable = z.object({
  kind: RankingKind,
  name: z.string(),
  publication: z.object({ id: z.number(), date: z.string(), week: z.string() }),
  categories: z.record(EventCode, z.array(RankingRow)),
})
export type RankingTable = z.infer<typeof RankingTable>

const Final = z.object({
  event: EventCode,
  winners: z.array(Person),
  losers: z.array(Person),
  games: z.array(Pair),
  note: NullableString,
})

export const Series = z.object({
  id: z.string(),
  name: z.string(),
  editions: z.array(
    z.object({
      code: z.string(),
      year: z.number(),
      slug: z.string(),
      title: z.string(),
      level: Level,
      city: z.string(),
      country: z.string(),
      venue: NullableString,
      start: z.string(),
      end: z.string(),
      cancelled: z.boolean(),
      finals: z.array(Final),
    }),
  ),
})
export type Series = z.infer<typeof Series>

export const MediaKind = z.enum([
  'full_match',
  'highlights',
  'court_stream',
  'play_of_the_day',
  'top_shots',
  'short',
  'promo',
  'other',
])
export type MediaKind = z.infer<typeof MediaKind>

export const MediaItem = z.object({
  id: z.string(),
  title: z.string(),
  kind: MediaKind,
  publishedAt: z.string(),
  durationSec: NullableNumber,
  live: z.enum(['none', 'upcoming', 'live']),
  sides: z.tuple([z.array(z.string()), z.array(z.string())]).nullable(),
  round: NullableString,
  day: NullableNumber,
  court: NullableNumber,
})
export type MediaItem = z.infer<typeof MediaItem>

export const TournamentMedia = z.object({
  code: z.string(),
  playlistId: NullableString,
  fetchedAt: z.string(),
  items: z.array(MediaItem),
})
export type TournamentMedia = z.infer<typeof TournamentMedia>

export const NewsSite = z.enum(['world-tour', 'world-tour-finals'])
export type NewsSite = z.infer<typeof NewsSite>

export const NewsImage = z.object({
  id: z.string(),
  v: z.number(),
  ext: z.string(),
  caption: NullableString,
})
export type NewsImage = z.infer<typeof NewsImage>

export const NewsItem = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  publishedAt: z.string(),
  url: z.string(),
  site: NewsSite,
  feature: z.boolean(),
  image: NewsImage.nullable(),
  excerpt: NullableString,
  series: NullableString,
  tournaments: z.array(z.string()),
  players: z.array(z.string()),
})
export type NewsItem = z.infer<typeof NewsItem>

export const NewsMonthCount = z.object({ month: z.string(), count: z.number() })
export type NewsMonthCount = z.infer<typeof NewsMonthCount>

export const NewsMonth = z.object({ month: z.string(), items: z.array(NewsItem) })
export type NewsMonth = z.infer<typeof NewsMonth>

export const PopularList = z.object({ asOf: z.string(), items: z.array(NewsItem) })
export type PopularList = z.infer<typeof PopularList>

export const NewsIndex = z.object({
  asOf: z.string(),
  latest: z.array(NewsItem),
  popular: z.array(NewsItem),
  months: z.array(NewsMonthCount),
})
export type NewsIndex = z.infer<typeof NewsIndex>

export const NewsTournament = z.object({ code: z.string(), items: z.array(NewsItem) })
export type NewsTournament = z.infer<typeof NewsTournament>

export const NewsLink = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('player'), id: z.string() }),
  z.object({
    kind: z.literal('tournament'),
    code: z.string(),
    tab: z.enum(['draw', 'matches', 'players']).optional(),
    date: OptionalString,
  }),
  z.object({ kind: z.literal('news'), id: z.string() }),
  z.object({ kind: z.literal('external'), href: z.string() }),
])
export type NewsLink = z.infer<typeof NewsLink>

export const NewsRun = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  link: NewsLink.optional(),
})
export type NewsRun = z.infer<typeof NewsRun>

export const NewsBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), runs: z.array(NewsRun) }),
  z.object({ type: z.literal('heading'), level: z.number().int().min(2).max(4), runs: z.array(NewsRun) }),
  z.object({ type: z.literal('quote'), runs: z.array(NewsRun), cite: NullableString }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.array(NewsRun)) }),
  z.object({ type: z.literal('image'), image: NewsImage }),
  z.object({ type: z.literal('video'), id: z.string(), title: NullableString }),
  z.object({ type: z.literal('divider') }),
])
export type NewsBlock = z.infer<typeof NewsBlock>

export const NewsArticle = NewsItem.extend({
  byline: NullableString,
  photoCredit: NullableString,
  tags: z.array(z.string()),
  matchedPlayers: z.array(z.string()).default([]),
  blocks: z.array(NewsBlock),
})
export type NewsArticle = z.infer<typeof NewsArticle>
