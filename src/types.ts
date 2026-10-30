export type {
  Calendar,
  CalendarEventDto,
  Continent,
  CurrentRank,
  EditionRef,
  EventCode,
  Focus,
  Level,
  MatchDto,
  PhotoCrop,
  PlayerBio,
  PlayerProfileDto,
  PlayerRecord,
  PlayersData,
  RaceRankings,
  RankingHistory,
  RankingKind,
  RankingPlayer,
  RankingRow,
  RankingTable,
  Retirement,
  Series,
  TournamentMatches,
} from '~/api/schemas';

import type { CalendarEventDto, EntryStage, EventCode, PlayerRecord } from '~/api/schemas';

export type MedalKind = 'gold' | 'silver' | 'bronze';

export interface Player {
  id: string;
  raw: string;
  name: string;
  first: string;
  last: string;
  surnameFirst: boolean;
  surname: string;
  cc: string;
}

export type TournamentStatus = 'done' | 'live' | 'up' | 'cancelled';

export interface Champion {
  event: EventCode;
  players: Player[];
}

export interface Tournament extends CalendarEventDto {
  index: number;
  year: number;
  month: number;
  status: TournamentStatus;
  daysUntil: number;
  dayNumber: number;
  totalDays: number;
  dates: string;
  datesLong: string;
  place: string;
  cc: string;
  prizeLabel: string;
  levelLabel: string;
  levelColor: string;
  logo: string;
  header: string;
  headerSquare: string;
  shortTitle: string;
  heading: string;
  champions: Champion[];
  onCourt?: boolean;
  firstMatch?: MatchTimeRef | null;
  startsAt?: string;
  startsSoon?: boolean;
}

export type MatchStatus = 'F' | 'P' | 'N';
export type Game = readonly [number, number];
export type Side = 0 | 1;
export type SideResult = 'won' | 'lost' | 'live' | 'up';
export type MatchOutcome = 'W' | 'L' | 'Live' | 'up';

export interface Team {
  seed: number | null;
  players: Player[];
  key: string;
}

export interface Match {
  id: string;
  date: string;
  dayIndex: number;
  court: number;
  time: string;
  timeZone: string | null;
  utcOffset: number | null;
  event: EventCode;
  round: string;
  group: string | null;
  status: MatchStatus;
  winner: 0 | 1 | 2;
  teams: [Team, Team];
  games: Game[];
  current: Game | null;
  durationMin: number;
  serve: number;
  note: string | null;
  code: string | null;
  pause: string | null;
  lastPoint: number;
  review: boolean;
}

export type MatchTimeRef = Pick<Match, 'date' | 'time' | 'timeZone' | 'utcOffset'>;

export interface DrawSlot {
  match: Match;
  slot: number;
}

export interface EntryListing {
  event: EventCode;
  stage: EntryStage;
  rank: number | null;
  team: Team;
}

export interface TournamentDay {
  index: number;
  date: string;
  weekday: string;
  weekdayLong: string;
  dayOfMonth: string;
  dayNum: string;
  shortLabel: string;
  month: string;
  monthLong: string;
  rounds: string[];
  roundsLabel: string;
  count: number;
  isToday: boolean;
  isLive: boolean;
  isPast: boolean;
  isRest: boolean;
  matches: Match[];
}

export interface TournamentSchedule {
  asOf: string;
  stale: boolean;
  days: TournamentDay[];
  todayIndex: number;
  focusIndex: number;
  matches: Match[];
}

export interface SeasonMatch {
  match: Match;
  tournament: Tournament;
}

export interface DirectoryRecord extends PlayerRecord {
  id: string;
}

export interface PlayerDirectory {
  week: string;
  get: (id: string) => DirectoryRecord | undefined;
}

export interface PlayerMatch {
  key: string;
  match: Match;
  tournament: Tournament;
  side: Side;
  outcome: MatchOutcome;
}

export interface SeasonIndex {
  players: Map<string, Player>;
  matches: Map<string, PlayerMatch[]>;
  teams: Map<string, PlayerMatch[]>;
}

export interface PerspectiveGame {
  key: number;
  me: number;
  opp: number;
  state: 'win' | 'loss' | 'live';
}

export interface StatItem {
  key: string;
  label: string;
  value: string;
  unit?: string;
  inline?: string;
  sub?: string;
  date?: string;
}

export interface FactItem {
  key: string;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  brand?: string;
  lang?: 'en';
}

export interface BioView {
  stats: StatItem[];
  details: FactItem[];
  equipment: FactItem[];
  notes: FactItem[];
  links: FactItem[];
  prize: string;
  ambition: string;
}

interface RaceView {
  rank: number;
  change: number;
  points: number;
  qualified: boolean;
  blocked: boolean;
}

export interface RankView {
  ev: EventCode;
  rank: number | null;
  change: number;
  race: RaceView | null;
  partner: Player | null;
  highest: number | null;
  highestPartner: Player | null;
  samePartner: boolean;
}

export type SeasonPhase = 'past' | 'current' | 'future';

export interface SeasonSummary {
  year: number;
  phase: SeasonPhase;
  total: number;
  done: number;
  cancelled: number;
  liveCount: number;
  live: Tournament | undefined;
  next: Tournament | undefined;
  target: Tournament | undefined;
  finals: Tournament | undefined;
}

export type RankedPlayer = Player & { known: boolean; photo: string | null };

export type QualifyStatus = 'qualified' | 'blocked' | null;

export interface RankRow {
  key: string;
  rank: number;
  change: number;
  isNew: boolean;
  points: number;
  tournaments: number | null;
  players: RankedPlayer[];
  countries: string[];
  text: string;
  qualify: QualifyStatus;
  cutoff: boolean;
}
