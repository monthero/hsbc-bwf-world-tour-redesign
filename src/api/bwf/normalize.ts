import { EventCode, type EntryStage, type MatchDto } from '../schemas';
import type { BwfDrawData, BwfEntry, BwfMatch, BwfMatchStat } from './schemas';

const ROUNDS: Record<string, string> = { 'Qual. R16': 'Q-R16', 'Qual. QF': 'Q-QF', Final: 'F' };

const STATUSES: Record<string, MatchDto['status']> = { F: 'F', P: 'P', C: 'P', W: 'P', H: 'P' };

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
  const status = STATUSES[m.matchStatus] ?? 'N';
  return {
    court: Number(m.courtCode) || (m.courtIndex ?? 0) + 1,
    time: m.matchTime?.slice(11, 16) ?? '',
    event: event.data,
    round: ROUNDS[m.roundName] ?? m.roundName,
    status,
    winner: m.winner ?? 0,
    teams: [toTeam(m.team1, m.team1seed, names), toTeam(m.team2, m.team2seed, names)],
    games: score.map((s) => [s.home, s.away]),
    durationMin: m.duration ?? 0,
    serve: status === 'P' ? Number(score.at(-1)?.serve) || 0 : 0,
    note: m.scoreStatus ? (m.scoreStatusValue ?? null) : null,
    code: m.code ?? undefined,
    pause: status === 'P' && m.matchStatus !== 'P' ? (m.matchStatusValue ?? null) : null,
    lastPoint: status === 'P' ? (score.at(-1)?.lastPointWinner ?? 0) : 0,
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
  challenges: { used: number; won: number; lost: number };
}

export type MatchStats = [SideStats, SideStats];

export const toMatchStats = ({ results: r }: BwfMatchStat): MatchStats | null =>
  r && [
    {
      longestRun: r.team1_consecutive_points,
      ralliesWon: r.team1_rallies_won,
      challenges: { used: r.team1_challenge_used, won: r.team1_challenge_won, lost: r.team1_challenge_lost },
    },
    {
      longestRun: r.team2_consecutive_points,
      ralliesWon: r.team2_rallies_won,
      challenges: { used: r.team2_challenge_used, won: r.team2_challenge_won, lost: r.team2_challenge_lost },
    },
  ];
