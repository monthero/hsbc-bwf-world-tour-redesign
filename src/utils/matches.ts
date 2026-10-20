import type { MessageDescriptor } from '@lingui/core';
import { msg, t } from '@lingui/core/macro';

import type { DrawMatchDto, EntryDto } from '~/api/bwf/normalize';
import { TBD } from '~/components/match/labels';
import {
  DOUBLES_EVENTS,
  GROUP_ROUND_NAMES,
  GROUP_STAGE,
  NOTE_LABELS,
  REST_DAY,
  ROUND_NAMES,
  ROUND_ORDER,
} from '~/constants';
import { lazyRecord, translate } from '~/i18n/lazy';
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
import { date, formatWall, isoRange } from './dates';
import { isolate, isolateLtr } from './format';
import { NO_VENUE, venueTimeOn, type VenueTime } from './match-time';
import { compareText, foldText, toPlayer } from './names';

export const roundName = (r: string) => ROUND_NAMES[r] ?? r;

const dayRoundName = (r: string) => (r in GROUP_ROUND_NAMES ? translate(GROUP_STAGE) : roundName(r));

const byRoundOrder = (a: string, b: string) => (ROUND_ORDER[a] ?? 0) - (ROUND_ORDER[b] ?? 0);

export const roundsLabel = (rounds: readonly string[]) =>
  [...new Set([...rounds].sort(byRoundOrder).map(dayRoundName).filter(Boolean))].join(' · ');

const QUALIFYING_CODES: Record<string, string> = { 'Q-R32': 'Q32', 'Q-R16': 'Q16', 'Q-QF': 'QQF' };

export const roundCode = (m: Pick<Match, 'round' | 'group'>) =>
  m.group ? `${m.group}·${m.round}` : (QUALIFYING_CODES[m.round] ?? m.round);

export const matchRoundName = (m: Pick<Match, 'round' | 'group'>) => {
  if (!m.group) return roundName(m.round);
  const group = m.group;
  const round = GROUP_ROUND_NAMES[m.round] ?? roundName(m.round);
  return t({
    message: `Group ${group} · ${round}`,
    comment: 'World Tour Finals match: its group and round inside the group, e.g. "Group A · Round 2"',
  });
};

export const isDoubles = (ev: EventCode) => DOUBLES_EVENTS.has(ev);

export const opposite = (side: Side): Side => (side === 0 ? 1 : 0);

const teamKey = (players: readonly { id: string }[]) =>
  players
    .map((p) => p.id)
    .sort(compareText)
    .join('&');

export const teamEventKey = (ev: EventCode, key: string) => `${ev}|${key}`;

export const byMatchTime = (a: Match, b: Match) =>
  a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.court - b.court;

const toTeam = (dto: MatchDto['teams'][number]): Team => {
  const players = dto.players.filter((p) => p.name).map((p) => toPlayer(p.name, p.cc, p.id));
  return { seed: dto.seed, players, key: teamKey(players) };
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

const courtName = (court: number) =>
  t({ message: `Court ${court}`, comment: 'The numbered court a badminton match is played on, e.g. "Court 3"' });

export const courtLabel = (court: number) => (court ? courtName(court) : '');

export const isScheduled = (m: Match) => m.date !== '';

const TBA = msg({
  message: 'To be announced',
  comment: 'Schedule: the rounds played on this tournament day are not published yet',
});

const unknownLabel = (tour: Tournament) => (tour.status === 'up' || tour.status === 'live' ? translate(TBA) : '—');

const todayIndexOf = (tour: Tournament, days: readonly TournamentDay[]) => {
  if (tour.status === 'live') return days.findIndex((d) => d.isToday);
  return tour.status === 'done' ? days.length - 1 : -1;
};

const focusIndexOf = (days: readonly TournamentDay[], todayIndex: number) => {
  const next = days.findIndex((d) => d.index >= todayIndex && !d.isRest);
  return next < 0 ? todayIndex : next;
};

const dayMatches = (tour: Tournament, data: TournamentMatches, day: string, index: number, settled: boolean) => {
  const venue = venueTimeOn(tour.timeZone, day, data.utcOffsets?.[day] ?? null);
  return (data.days[day] ?? [])
    .map((m, i) => toMatch(m, day, index, i, venue))
    .filter((m) => !settled || m.status !== 'N')
    .sort(byMatchTime);
};

const WEEKDAY = { weekday: 'short' } as const;
const WEEKDAY_LONG = { weekday: 'long' } as const;
const DAY_PADDED = { day: '2-digit' } as const;
const DAY_NUMBER = { day: 'numeric' } as const;
const SHORT_DAY = { weekday: 'short', day: 'numeric' } as const;
const MONTH = { month: 'short' } as const;
const MONTH_LONG = { month: 'long' } as const;

export const finalDayOver = (end: string, data: TournamentMatches | undefined) => {
  const last = data?.days[end] ?? [];
  return last.length > 0 && last.every((m) => m.status === 'F');
};

const allMatches = (data: TournamentMatches | undefined) => Object.values(data?.days ?? {}).flat();

export const hasMatchOnCourt = (data: TournamentMatches | undefined) => allMatches(data).some((m) => m.status === 'P');

const wasPlayed = (m: MatchDto) => m.status === 'P' || (m.status === 'F' && m.games.length > 0);

export const playHasBegun = (data: TournamentMatches | undefined) => allMatches(data).some(wasPlayed);

export const firstMatchOf = (tour: Pick<Tournament, 'start' | 'timeZone'>, data: TournamentMatches) => {
  const times = (data.days[tour.start] ?? []).map((m) => m.time).filter(Boolean);
  if (!times.length) return null;
  const venue = venueTimeOn(tour.timeZone, tour.start, data.utcOffsets?.[tour.start] ?? null);
  return { date: tour.start, time: times.sort(compareText)[0] ?? '', ...venue };
};

export const buildSchedule = (tour: Tournament, data: TournamentMatches, todayIso: string): TournamentSchedule => {
  const settled = tour.status === 'done';
  const raw = isoRange(tour.start, tour.end).map((day, index) => {
    const matches = dayMatches(tour, data, day, index, settled);
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
      weekday: formatWall(d, WEEKDAY),
      weekdayLong: formatWall(d, WEEKDAY_LONG),
      dayOfMonth: formatWall(d, DAY_PADDED),
      dayNum: formatWall(d, DAY_NUMBER),
      shortLabel: formatWall(d, SHORT_DAY),
      month: formatWall(d, MONTH),
      monthLong: formatWall(d, MONTH_LONG),
      rounds,
      roundsLabel: roundsLabel(rounds) || (isRest ? translate(REST_DAY) : unknownLabel(tour)),
      count,
      isToday: day === todayIso,
      isLive: day === todayIso && tour.status === 'live',
      isPast,
      isRest,
      matches,
    };
  });
  const todayIndex = todayIndexOf(tour, days);
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

const ADVANCE_LABELS: Record<string, string> = lazyRecord({
  F: msg({ message: 'Champion', context: 'result tag', comment: 'Result tag on the winner of a tournament final' }),
  R32: msg({
    message: 'Into R16',
    comment: 'Result tag on the winner of a round-of-32 match: they reach the round of 16 (R16 is the round code)',
  }),
  R16: msg({
    message: 'Into QF',
    comment: 'Result tag on the winner of a round-of-16 match: they reach the quarter-finals (QF is the round code)',
  }),
  QF: msg({
    message: 'Into SF',
    comment: 'Result tag on the winner of a quarter-final: they reach the semi-finals (SF is the round code)',
  }),
  SF: msg({ message: 'Into final', comment: 'Result tag on the winner of a semi-final: they reach the final' }),
});

const NEXT_ROUND_LABEL = msg({
  message: 'Into next round',
  comment: 'Result tag on the winner of a match: they go through to the next round',
});

const advanceLabel = (round: string) => ADVANCE_LABELS[round] ?? translate(NEXT_ROUND_LABEL);

const wonLabel = (group: string) =>
  t({ message: `Won · Group ${group}`, comment: 'Result tag on the winner of a World Tour Finals group match' });

const lostLabel = (group: string) =>
  t({ message: `Lost · Group ${group}`, comment: 'Result tag on the loser of a World Tour Finals group match' });

const OUT_LABELS: Record<string, string> = lazyRecord({
  'Q-R32': msg({
    message: 'Out · Q-R32',
    comment: 'Result tag on the loser of a qualifying round-of-32 match: knocked out of qualifying in this round',
  }),
  'Q-R16': msg({
    message: 'Out · Q-R16',
    comment: 'Result tag on the loser of a qualifying round-of-16 match: knocked out of qualifying in this round',
  }),
  'Q-QF': msg({
    message: 'Out · Q-QF',
    comment: 'Result tag on the loser of a qualifying quarter-final: knocked out of qualifying in this round',
  }),
  'Q-SF': msg({
    message: 'Out · Q-SF',
    comment: 'Result tag on the loser of a qualifying semi-final: knocked out of qualifying in this round',
  }),
  'Q-F': msg({
    message: 'Out · Q-F',
    comment: 'Result tag on the loser of a qualifying final: knocked out of qualifying in its last round',
  }),
  R64: msg({
    message: 'Out · R64',
    comment: 'Result tag on the loser of a round-of-64 match: knocked out in this round',
  }),
  R32: msg({
    message: 'Out · R32',
    comment: 'Result tag on the loser of a round-of-32 match: knocked out in this round',
  }),
  R16: msg({
    message: 'Out · R16',
    comment: 'Result tag on the loser of a round-of-16 match: knocked out in this round',
  }),
  QF: msg({ message: 'Out · QF', comment: 'Result tag on the loser of a quarter-final: knocked out in this round' }),
  SF: msg({ message: 'Out · SF', comment: 'Result tag on the loser of a semi-final: knocked out in this round' }),
  F: msg({ message: 'Out · F', comment: 'Result tag on the loser of a tournament final: beaten in the final' }),
});

const outLabel = (round: string) =>
  OUT_LABELS[round] ??
  t({
    message: `Out · ${round}`,
    comment:
      'Result tag on the loser of a knockout match: knocked out in this round. {round} is a round code not covered by the other “Out ·” tags',
  });

const liveLabel = () =>
  t({ message: 'Live', context: 'match status', comment: 'Status tag: the match is being played right now' });

const liveCourtLabel = (court: number) =>
  t({
    message: `Live · Court ${court}`,
    comment: 'Status tag: the match is being played right now on this numbered court',
  });

export const sideStatus = (m: Match, side: Side, { court = false } = {}): { tone: SideResult; label: string } => {
  const tone = sideResult(m, side);
  switch (tone) {
    case 'won':
      return { tone, label: m.group ? wonLabel(m.group) : advanceLabel(m.round) };
    case 'lost':
      return { tone, label: m.group ? lostLabel(m.group) : outLabel(m.round) };
    case 'live':
      return { tone, label: court ? liveCourtLabel(m.court) : liveLabel() };
    default:
      return { tone, label: court ? courtName(m.court) : '' };
  }
};

export const allGames = (m: Match): Game[] => (m.current ? [...m.games, m.current] : m.games);

export const gameWon = (g: Game, side: Side) => g[side] > g[opposite(side)];

export const formatGames = (games: readonly Game[], side: Side = 0) =>
  isolateLtr(games.map((g) => `${g[side]}–${g[opposite(side)]}`).join(', '));

export const noteLabel = (note: string | null, form: 'short' | 'long') =>
  note && note in NOTE_LABELS ? NOTE_LABELS[note as keyof typeof NOTE_LABELS][form] : '';

export const teamLabel = (team: Team, sep: ' / ' | ' & ' = ' / ') =>
  isolate(
    team.players.length === 1
      ? (team.players[0]?.name ?? translate(TBD))
      : team.players.map((p) => p.surname).join(sep) || translate(TBD),
  );

const NOTE_TIPS: Record<string, MessageDescriptor> = {
  Walkover: msg({
    message: 'Walkover · {team} withdrew before the match',
    comment:
      'Tooltip on a walkover: the match was not played because {team} (a player or pair) withdrew, so the other side advanced',
  }),
  Retired: msg({
    message: 'Retired · {team} retired during the match',
    comment:
      'Tooltip on a retirement: {team} (a player or pair) stopped playing during the match, usually injured, and lost',
  }),
};

export const noteTip = (m: Match) => {
  const long = noteLabel(m.note, 'long');
  const winner = winnerSide(m);
  const tip = m.note ? NOTE_TIPS[m.note] : undefined;
  if (!long || winner === null || !tip) return long;
  return translate(tip, { team: teamLabel(m.teams[opposite(winner)], ' & ') });
};

export const matchTitle = (m: Match) => {
  const home = teamLabel(m.teams[0]);
  const away = teamLabel(m.teams[1]);
  return t({ message: `${home} vs ${away}`, comment: 'The two sides of a match, e.g. "Axelsen vs Shi"' });
};

export const detailsLabel = (title: string) =>
  t({
    message: `Match details: ${title}`,
    comment: 'Accessible name of a card that opens the match details. {title} names the players, e.g. "Axelsen vs Shi"',
  });

export const teamPlayers = (m: Match) => m.teams.flatMap((team) => team.players);

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

const teamHas = (team: Pick<Team, 'players'>, s: string) => team.players.some((p) => playerHas(p, s));

export const teamMatchesQuery = (team: Pick<Team, 'players'>, q: string) => {
  const s = normQuery(q);
  return !s || teamHas(team, s);
};

export const matchesQuery = (m: Match, q: string) => {
  const s = normQuery(q);
  return !s || m.teams.some((team) => teamHas(team, s));
};
