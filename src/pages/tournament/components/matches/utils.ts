import { t } from '@lingui/core/macro';

import { EventCode } from '~/api/schemas';
import { EVENT_NAMES, ROUND_ORDER } from '~/constants';
import type { useFavoritesMatcher } from '~/stores/favorites';
import type { Match, TournamentDay } from '~/types';
import { dayMark, type ClockTime, type NextKind } from '~/utils/match-time';
import { courtLabel, matchesQuery, roundsLabel, teamLabel, teamPlayers } from '~/utils/matches';

import { MatchSort } from '../../types';

interface MatchGroup {
  key: string;
  label: string;
  items: Match[];
}

export interface MatchSection {
  groups: MatchGroup[];
  count: number;
  rounds: string;
}

export interface EventChipModel {
  code: EventCode;
  count: number;
  active: boolean;
}

export interface CourtChipModel {
  court: number;
  count: number;
  active: boolean;
  live: boolean;
}

export interface MatchesView {
  evChips: EventChipModel[];
  courtChips: CourtChipModel[];
  upcoming: MatchSection;
  results: MatchSection;
  liveIn: number;
  ordered: Match[];
  next: ReadonlyMap<string, NextKind>;
  sort: MatchSort;
  sorts: MatchSort[];
}

export type PlayersMatcher = ReturnType<typeof useFavoritesMatcher>;

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

export const parseEvents = (s: string) => (s ? (s.split(',') as EventCode[]) : []);

export const parseCourts = (s: string) => (s ? s.split(',').map(Number) : []);

const isUpcoming = (m: Match) => m.status === 'N';

export const isSettled = (m: Match) => m.status === 'F';

export type MatchClock = (m: Match) => ClockTime | null;

const hourLabel = (c: ClockTime | null) => (c ? `${c.hour}${c.shift ? ` ${dayMark(c.shift)}` : ''}` : '');

interface RawGroup {
  key: string;
  items: Match[];
  time?: string;
  name?: string;
}

const bucket = (list: readonly Match[], keyOf: (m: Match) => string) => {
  const groups = new Map<string, { key: string; first: Match; items: Match[] }>();
  for (const m of list) {
    const key = keyOf(m);
    const group = groups.get(key);
    if (group) group.items.push(m);
    else groups.set(key, { key, first: m, items: [m] });
  }
  return [...groups.values()];
};

const slotsOf = (list: readonly Match[], clock: MatchClock): RawGroup[] => {
  const slots: RawGroup[] = [];
  for (const m of list) {
    const key = hourLabel(clock(m));
    const last = slots.at(-1);
    if (last?.key === key) last.items.push(m);
    else slots.push({ key, time: key, items: [m] });
  }
  return slots;
};

const roundOf = (m: Match) => roundsLabel([m.round]);

const roundsOf = (items: readonly Match[]) => roundsLabel(items.map((m) => m.round));

const followingHeading = () =>
  t({
    message: 'Following',
    context: 'matches',
    comment: 'Match list group heading: matches with players or countries the visitor follows, listed first',
  });

export type Followed = (m: Match) => boolean;

interface SortContext {
  clock: MatchClock;
  followed: Followed;
}

const GROUPERS: Record<MatchSort, (list: readonly Match[], c: SortContext) => RawGroup[]> = {
  time: (list, c) => slotsOf(list, c.clock),
  court: (list) =>
    bucket(list, (m) => String(m.court))
      .sort((a, b) => a.first.court - b.first.court)
      .map(({ key, first, items }) => ({ key, items, name: courtLabel(first.court) })),
  event: (list) =>
    bucket(list, (m) => m.event)
      .sort((a, b) => EventCode.options.indexOf(a.first.event) - EventCode.options.indexOf(b.first.event))
      .map(({ key, first, items }) => ({ key, items, name: EVENT_NAMES[first.event] })),
  round: (list) =>
    bucket(list, roundOf)
      .sort((a, b) => (ROUND_ORDER[a.first.round] ?? 0) - (ROUND_ORDER[b.first.round] ?? 0))
      .map(({ key, items }) => ({ key, items, name: key })),
  following: (list, c) => {
    const mine = list.filter(c.followed);
    const rest = slotsOf(
      list.filter((m) => !c.followed(m)),
      c.clock,
    );
    return mine.length ? [{ key: 'following', name: followingHeading(), items: mine }, ...rest] : rest;
  },
};

const slotLabel = (time: string, rounds: string, mixed: boolean) => {
  if (!time)
    return mixed
      ? t({
          message: `Time to be announced · ${rounds}`,
          comment: 'Match list group heading for matches without a start time yet. {rounds} lists the rounds',
        })
      : t({
          message: 'Time to be announced',
          comment: 'Match list group heading for matches without a start time yet',
        });
  return mixed
    ? t({
        message: `From ${time} · ${rounds}`,
        comment: 'Match list group heading: matches starting from this hour, e.g. "From 10:00 · Quarter-final"',
      })
    : t({
        message: `From ${time}`,
        comment: 'Match list group heading: matches starting from this hour, e.g. "From 10:00"',
      });
};

const groupLabel = (g: RawGroup & { rounds: string }, mixed: boolean) => {
  if (g.time !== undefined) return slotLabel(g.time, g.rounds, mixed);
  const name = g.name ?? '';
  return mixed && g.rounds !== name ? `${name} · ${g.rounds}` : name;
};

const toSection = (list: Match[], sort: MatchSort, c: SortContext): MatchSection => {
  const rounds = roundsOf(list);
  const groups = GROUPERS[sort](list, c).map((g) => ({ ...g, rounds: roundsOf(g.items) }));
  const mixed = groups.some((g) => g.rounds !== rounds);
  return {
    count: list.length,
    rounds: mixed ? '' : rounds,
    groups: groups.map((g) => ({ key: g.key, items: g.items, label: groupLabel(g, mixed) })),
  };
};

const distinct = (list: readonly Match[], keyOf: (m: Match) => unknown) => new Set(list.map(keyOf)).size;

interface SortSupport {
  matches: readonly Match[];
  following: boolean;
  followed: Followed;
}

const SORT_SUPPORT: Record<MatchSort, (s: SortSupport) => boolean> = {
  time: () => true,
  court: (s) => distinct(s.matches, (m) => m.court) > 1,
  event: (s) => distinct(s.matches, (m) => m.event) > 1,
  round: (s) => distinct(s.matches, roundOf) > 1,
  following: (s) => !s.following && s.matches.some(s.followed),
};

const nextPerCourt = (matches: Match[]) => {
  const started = new Set(matches.filter((m) => m.status !== 'N').map((m) => m.court));
  const next = new Map<number, [string, NextKind]>();
  for (const m of matches)
    if (m.status === 'N' && !next.has(m.court)) next.set(m.court, [m.id, started.has(m.court) ? 'later' : 'first']);
  return new Map(next.values());
};

export const isFinalsDay = (d: TournamentDay | undefined) =>
  !!d?.matches.length && d.matches.every((m) => m.round === 'F');

export const followedBy =
  (matcher: PlayersMatcher): Followed =>
  (m) =>
    matcher(teamPlayers(m));

export const filterBase = (matches: Match[], q: string, following: boolean, followed: Followed) =>
  matches.filter((m) => matchesQuery(m, q) && (!following || followed(m)));

export const buildView = (
  dayMatches: Match[],
  base: Match[],
  events: EventCode[],
  courts: number[],
  sorting: { sort: MatchSort; following: boolean; followed: Followed },
  clock: MatchClock,
): MatchesView => {
  const courtsAll = [...new Set(dayMatches.map((m) => m.court))].sort((a, b) => a - b);
  const evOn = events.length > 0 && events.length < EventCode.options.length;
  const ctOn = courts.length > 0 && courts.length < courtsAll.length;
  const evOk = (m: Match) => !evOn || events.includes(m.event);
  const ctOk = (m: Match) => !ctOn || courts.includes(m.court);
  const evChips = EventCode.options.map((code) => ({
    code,
    count: base.filter((m) => m.event === code && ctOk(m)).length,
    active: events.includes(code),
  }));
  const courtChips =
    courtsAll.length > 1
      ? courtsAll.map((court) => {
          const l = base.filter((m) => m.court === court && evOk(m));
          return { court, count: l.length, active: courts.includes(court), live: l.some((m) => m.status === 'P') };
        })
      : [];
  const list = base.filter((m) => evOk(m) && ctOk(m));
  const support = { matches: dayMatches, following: sorting.following, followed: sorting.followed };
  const sorts = MatchSort.options.filter((s) => SORT_SUPPORT[s](support));
  const sort = sorts.includes(sorting.sort) ? sorting.sort : 'time';
  const context = { clock, followed: sorting.followed };
  const upcoming = toSection(list.filter(isUpcoming), sort, context);
  const results = toSection(list.filter(isSettled), sort, context);
  return {
    evChips,
    courtChips,
    upcoming,
    results,
    liveIn: list.length - upcoming.count - results.count,
    ordered: GROUPERS[sort](list, context).flatMap((g) => g.items),
    next: nextPerCourt(dayMatches),
    sort,
    sorts,
  };
};
