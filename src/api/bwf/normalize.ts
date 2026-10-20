import { gameDone } from '~/utils/live';
import { wallClock } from '~/utils/utc-offset';

import { EventCode, type EntryStage, type MatchDto } from '../schemas';
import { BWF_ROUNDS, BWF_STATUSES } from './codes';
import type { BwfDrawData, BwfEntry, BwfLiveMatches, BwfMatch, BwfMatchStat } from './schemas';

const REVIEW = 'H';
const OFF_COURT = 'O';

type Score = NonNullable<BwfMatch['score']>;

const winnerOf = (score: Score) => {
  const done = score.filter((s) => gameDone([s.home, s.away]));
  const home = done.filter((s) => s.home > s.away).length;
  const away = done.length - home;
  if (home === away) return 0;
  return home > away ? 1 : 2;
};

type TeamDto = MatchDto['teams'][number];

export type NameOf = (id: string) => string | undefined;

const person = (names: NameOf, id: string, name: string, cc: string | null | undefined) => ({
  id,
  name: names(id) ?? name,
  cc: cc ?? '',
});

const toSeed = (seed: BwfMatch['team1seed']) => (seed ? Number(seed) || null : null);

const toTeam = (team: BwfMatch['team1'], seed: BwfMatch['team1seed'], names: NameOf): TeamDto => ({
  seed: toSeed(seed),
  players: (team?.players ?? []).map((p) => person(names, p.id, p.nameDisplay, p.countryCode)),
});

export const toMatchDto = (m: BwfMatch, names: NameOf): MatchDto | null => {
  const event = EventCode.safeParse(m.eventName);
  if (m.isTeamMatch || !event.success) return null;
  const score = m.score ?? [];
  const status = BWF_STATUSES[m.matchStatus] ?? 'N';
  return {
    court: Number(m.courtCode) || (m.courtIndex ?? 0) + 1,
    time: wallClock(m.matchTime),
    event: event.data,
    round: BWF_ROUNDS[m.roundName] ?? m.roundName,
    status,
    winner: m.winner || (m.matchStatus === OFF_COURT ? winnerOf(score) : 0),
    teams: [toTeam(m.team1, m.team1seed, names), toTeam(m.team2, m.team2seed, names)],
    games: score.map((s) => [s.home, s.away]),
    durationMin: m.duration ?? 0,
    serve: status === 'P' ? Number(score.at(-1)?.serve) || 0 : 0,
    note: m.scoreStatus ? (m.scoreStatusValue ?? null) : null,
    code: m.code ?? undefined,
    pause: status === 'P' && m.matchStatus !== 'P' ? (m.matchStatusValue ?? null) : null,
    lastPoint: status === 'P' ? (score.at(-1)?.lastPointWinner ?? 0) : 0,
    review: m.matchStatus === REVIEW || undefined,
  };
};

export interface DrawMatchDto {
  match: MatchDto;
  slot: number;
}

export const toDrawMatches = ({ results }: BwfDrawData, names: NameOf): DrawMatchDto[] =>
  Object.entries(results ?? {}).flatMap(([key, { match }]) => {
    const dto = toMatchDto(match, names);
    const slot = Number(key.split('-')[1]);
    return dto && !Number.isNaN(slot) ? [{ match: dto, slot }] : [];
  });

export interface EntryDto {
  event: EventCode;
  stage: EntryStage;
  rank: number | null;
  team: TeamDto;
}

const ENTRY_STAGES: Partial<Record<number, EntryStage>> = { 1: 'main', 2: 'qual', 3: 'reserve', 100: 'withdrawn' };

export const toEntryDto = (event: EventCode, e: BwfEntry, names: NameOf): EntryDto | null => {
  const stage = ENTRY_STAGES[e.type_id];
  if (!stage) return null;
  const players = [
    { p: e.player1_model, cc: e.player1_country },
    { p: e.player2_model, cc: e.player2_country },
  ].flatMap(({ p, cc }) => (p ? [person(names, p.id, p.name_display, cc)] : []));
  const seed = toSeed(stage === 'qual' ? e.qseed : e.seed);
  return { event, stage, rank: e.rank || null, team: { seed, players } };
};

export interface SideStats {
  longestRun: number;
  ralliesWon: number;
  gamePoints: number;
  challenges: { used: number; won: number; lost: number };
}

export type MatchStats = [SideStats, SideStats];

const sideStats = (r: NonNullable<BwfMatchStat['results']>, t: 'team1' | 'team2'): SideStats => ({
  longestRun: r[`${t}_consecutive_points`],
  ralliesWon: r[`${t}_rallies_won`],
  gamePoints: r[`${t}_game_points`],
  challenges: { used: r[`${t}_challenge_used`], won: r[`${t}_challenge_won`], lost: r[`${t}_challenge_lost`] },
});

export const toMatchStats = ({ results: r }: BwfMatchStat): MatchStats | null =>
  r && [sideStats(r, 'team1'), sideStats(r, 'team2')];

export interface LiveServer {
  id: string;
  side: 0 | 1;
}

export const toLiveServers = ({ results }: BwfLiveMatches): Record<string, LiveServer> =>
  Object.fromEntries(
    (results ?? []).flatMap(({ live_detail: live, match_detail: d }) => {
      const n = live?.service_player ?? 0;
      const id = d && [d.team1_player1_id, d.team1_player2_id, d.team2_player1_id, d.team2_player2_id][n - 1];
      const server: LiveServer | null = id ? { id, side: n > 2 ? 1 : 0 } : null;
      return d && server ? [[d.code, server] as const] : [];
    }),
  );
