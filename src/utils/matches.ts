import type { DrawMatchDto, EntryDto } from '~/api/bwf/normalize';
import {
  DOUBLES_EVENTS,
  GROUP_ROUND_NAMES,
  GROUP_STAGE,
  NEXT_ROUND,
  NOTE_LABELS,
  REST_DAY,
  ROUND_NAMES,
  ROUND_ORDER,
} from '~/constants';
import type {
  DrawSlot,
  EntryListing,
  EventCode,
  Game,
  Match,
  MatchDto,
  Player,
  Side,
  SideResult,
  Team,
  Tournament,
  TournamentDay,
  TournamentMatches,
  TournamentSchedule,
} from '~/types';

import { countryName } from './countries';
import { date, isoRange } from './dates';
import { NO_VENUE, venueTimeOn, type VenueTime } from './match-time';
import { compareText, foldText, toPlayer } from './names';

export const roundName = (r: string) => ROUND_NAMES[r] ?? r;

export const groupName = (g: string) => `Group ${g}`;

const dayRoundName = (r: string) => (r in GROUP_ROUND_NAMES ? GROUP_STAGE : roundName(r));

const byRoundOrder = (a: string, b: string) => (ROUND_ORDER[a] ?? 0) - (ROUND_ORDER[b] ?? 0);

export const roundsLabel = (rounds: readonly string[]) =>
  [...new Set([...rounds].sort(byRoundOrder).map(dayRoundName).filter(Boolean))].join(' · ');

export const matchRoundName = (m: Pick<Match, 'round' | 'group'>) =>
  m.group ? `${groupName(m.group)} · ${GROUP_ROUND_NAMES[m.round] ?? roundName(m.round)}` : roundName(m.round);

export const isDoubles = (ev: EventCode) => DOUBLES_EVENTS.has(ev);

export const opposite = (side: Side): Side => (side === 0 ? 1 : 0);

export const teamKey = (players: readonly { id: string }[]) =>
  players
    .map((p) => p.id)
    .sort(compareText)
    .join('&');

export const teamEventKey = (ev: EventCode, key: string) => `${ev}|${key}`;

export const byMatchTime = (a: Match, b: Match) =>
  a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.court - b.court;

export const toTeam = (t: MatchDto['teams'][number]): Team => {
  const players = t.players.filter((p) => p.name).map((p) => toPlayer(p.name, p.cc, p.id));
  return { seed: t.seed, players, key: teamKey(players) };
};

export const toMatch = (m: MatchDto, day: string, dayIndex: number, i: number, venue: VenueTime = NO_VENUE): Match => {
  const live = m.status === 'P';
  const games = m.games.map((g) => [g[0], g[1]] as const);
  return {
    id: m.code ? `c${m.code}` : `${day}-${i}`,
    date: day,
    dayIndex,
    court: m.court,
    time: m.time,
    timeZone: venue.timeZone,
    utcOffset: venue.utcOffset,
    event: m.event,
    round: m.round,
    group: m.group ?? null,
    status: m.status,
    winner: m.winner === 1 || m.winner === 2 ? m.winner : 0,
    teams: [toTeam(m.teams[0]), toTeam(m.teams[1])],
    games: live ? games.slice(0, -1) : games,
    current: live ? (games.at(-1) ?? [0, 0]) : null,
    durationMin: m.durationMin,
    serve: m.serve,
    note: m.note,
    code: m.code ?? null,
    pause: m.pause ?? null,
    lastPoint: m.lastPoint ?? 0,
    review: m.review ?? false,
  };
};

export const toDrawSlots = (list: readonly DrawMatchDto[]): DrawSlot[] =>
  list.map(({ match, slot }, i) => ({ match: toMatch(match, '', -1, i), slot }));

export const toEntryListings = (list: readonly EntryDto[]): EntryListing[] =>
  list.map((e) => ({ ...e, team: toTeam(e.team) }));

export const isScheduled = (m: Match) => m.date !== '';

const TBA = 'To be announced';

const unknownLabel = (t: Tournament) => (t.status === 'up' || t.status === 'live' ? TBA : '—');

const todayIndexOf = (t: Tournament, days: readonly TournamentDay[]) => {
  if (t.status === 'live') return days.findIndex((d) => d.isToday);
  return t.status === 'done' ? days.length - 1 : -1;
};

const focusIndexOf = (days: readonly TournamentDay[], todayIndex: number) => {
  const next = days.findIndex((d) => d.index >= todayIndex && !d.isRest);
  return next < 0 ? todayIndex : next;
};

const dayMatches = (t: Tournament, data: TournamentMatches, day: string, index: number, settled: boolean) => {
  const venue = venueTimeOn(t.timeZone, day, data.utcOffsets?.[day] ?? null);
  return (data.days[day] ?? [])
    .map((m, i) => toMatch(m, day, index, i, venue))
    .filter((m) => !settled || m.status !== 'N')
    .sort(byMatchTime);
};

export const finalDayOver = (end: string, data: TournamentMatches | undefined) => {
  const last = data?.days[end] ?? [];
  return last.length > 0 && last.every((m) => m.status === 'F');
};

export const buildSchedule = (t: Tournament, data: TournamentMatches, todayIso: string): TournamentSchedule => {
  const settled = t.status === 'done';
  const raw = isoRange(t.start, t.end).map((day, index) => {
    const matches = dayMatches(t, data, day, index, settled);
    const planned = data.plannedDays[day];
    const rounds = [...new Set(matches.length ? matches.map((m) => m.round) : (planned?.rounds ?? []))];
    return { day, index, matches, rounds, count: matches.length || planned?.count || 0 };
  });
  const lastKnown = raw.findLastIndex((r) => r.rounds.length > 0);
  const days = raw.map(({ day, index, matches, rounds, count }): TournamentDay => {
    const d = date(day);
    const isPast = day < todayIso;
    const isRest = !rounds.length && index < lastKnown;
    return {
      index,
      date: day,
      weekday: d.format('ddd'),
      weekdayLong: d.format('dddd'),
      dayOfMonth: d.format('DD'),
      dayNum: d.format('D'),
      shortLabel: d.format('ddd D'),
      month: d.format('MMM'),
      monthLong: d.format('MMMM'),
      rounds,
      roundsLabel: roundsLabel(rounds) || (isRest ? REST_DAY : unknownLabel(t)),
      count,
      isToday: day === todayIso,
      isLive: day === todayIso && t.status === 'live',
      isPast,
      isRest,
      matches,
    };
  });
  const todayIndex = todayIndexOf(t, days);
  return {
    asOf: data.asOf,
    stale: !!data.stale,
    days,
    todayIndex,
    focusIndex: focusIndexOf(days, todayIndex),
    matches: days.flatMap((d) => d.matches),
  };
};

export const winnerSide = (m: Match): Side | null => (m.status === 'F' && m.winner ? ((m.winner - 1) as Side) : null);

export const winnerTeam = (m: Match): Team | null => {
  const side = winnerSide(m);
  return side === null ? null : m.teams[side];
};

export const sideResult = (m: Match, side: Side): SideResult => {
  if (m.status === 'P') return 'live';
  const w = winnerSide(m);
  if (w === null) return 'up';
  return w === side ? 'won' : 'lost';
};

export const advanceLabel = (round: string) =>
  round === 'F' ? 'Champion' : `Into ${NEXT_ROUND[round] ?? 'next round'}`;

export const sideStatus = (m: Match, side: Side, { court = false } = {}): { tone: SideResult; label: string } => {
  const tone = sideResult(m, side);
  switch (tone) {
    case 'won':
      return { tone, label: m.group ? `Won · ${groupName(m.group)}` : advanceLabel(m.round) };
    case 'lost':
      return { tone, label: m.group ? `Lost · ${groupName(m.group)}` : `Out · ${m.round}` };
    case 'live':
      return { tone, label: court ? `Live · Court ${m.court}` : 'Live' };
    default:
      return { tone, label: court ? `Court ${m.court}` : '' };
  }
};

export const allGames = (m: Match): Game[] => (m.current ? [...m.games, m.current] : m.games);

export const gameWon = (g: Game, side: Side) => g[side] > g[opposite(side)];

export const formatGames = (games: readonly Game[], side: Side = 0) =>
  games.map((g) => `${g[side]}–${g[opposite(side)]}`).join(', ');

export const noteLabel = (note: string | null, form: 'short' | 'long' | 'verb') =>
  note && note in NOTE_LABELS ? NOTE_LABELS[note as keyof typeof NOTE_LABELS][form] : '';

export const teamLabel = (t: Team, sep: ' / ' | ' & ' = ' / ') =>
  t.players.length === 1 ? (t.players[0]?.name ?? 'TBD') : t.players.map((p) => p.surname).join(sep) || 'TBD';

export const noteTip = (m: Match) => {
  const long = noteLabel(m.note, 'long');
  const winner = winnerSide(m);
  if (!long || winner === null) return long;
  return `${long} · ${teamLabel(m.teams[winner === 0 ? 1 : 0], ' & ')} ${noteLabel(m.note, 'verb')}`;
};

export const teamPlayers = (m: Match) => m.teams.flatMap((t) => t.players);

export const isMainDraw = (m: Pick<Match, 'round'>) => (ROUND_ORDER[m.round] ?? 1) > 0;

export const latestByTeam = (matches: readonly Match[]) => {
  const map = new Map<string, { match: Match; team: Team; side: Side }>();
  for (const match of matches)
    match.teams.forEach((team, i) => {
      if (team.players.length) map.set(teamEventKey(match.event, team.key), { match, team, side: i as Side });
    });
  return map;
};

export const normQuery = (q: string) => foldText(q.trim());

const playerHas = (p: Player, s: string) =>
  foldText(p.name).includes(s) || p.cc.toLowerCase() === s || foldText(countryName(p.cc)).includes(s);

export const playerMatchesQuery = (p: Player, q: string) => {
  const s = normQuery(q);
  return !s || playerHas(p, s);
};

export const teamMatchesQuery = (t: Pick<Team, 'players'>, q: string) => {
  const s = normQuery(q);
  return !s || t.players.some((p) => playerHas(p, s));
};

export const matchesQuery = (m: Match, q: string) => {
  const s = normQuery(q);
  return !s || m.teams.some((t) => t.players.some((p) => playerHas(p, s)));
};
