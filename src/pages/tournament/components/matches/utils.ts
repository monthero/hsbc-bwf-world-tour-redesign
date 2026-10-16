import { t } from '@lingui/core/macro';

import { EventCode } from '~/api/schemas';
import type { useFavoritesMatcher } from '~/stores/favorites';
import type { Match } from '~/types';
import { dayMark, type ClockTime, type NextKind } from '~/utils/match-time';
import { matchesQuery, roundsLabel, teamLabel, teamPlayers } from '~/utils/matches';

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
  next: ReadonlyMap<string, NextKind>;
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

const slotsOf = (list: Match[], clock: MatchClock) => {
  const slots: { key: string; items: Match[] }[] = [];
  for (const m of list) {
    const key = hourLabel(clock(m));
    const last = slots.at(-1);
    if (last?.key === key) last.items.push(m);
    else slots.push({ key, items: [m] });
  }
  return slots;
};

const roundsOf = (items: readonly Match[]) => roundsLabel(items.map((m) => m.round));

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

const toSection = (list: Match[], clock: MatchClock): MatchSection => {
  const rounds = roundsOf(list);
  const slots = slotsOf(list, clock).map((s) => ({ ...s, rounds: roundsOf(s.items) }));
  const mixed = slots.some((s) => s.rounds !== rounds);
  return {
    count: list.length,
    rounds: mixed ? '' : rounds,
    groups: slots.map(({ key, items, rounds: r }) => ({ key, items, label: slotLabel(key, r, mixed) })),
  };
};

const nextPerCourt = (matches: Match[]) => {
  const started = new Set(matches.filter((m) => m.status !== 'N').map((m) => m.court));
  const next = new Map<number, [string, NextKind]>();
  for (const m of matches)
    if (m.status === 'N' && !next.has(m.court)) next.set(m.court, [m.id, started.has(m.court) ? 'later' : 'first']);
  return new Map(next.values());
};

export const filterBase = (matches: Match[], q: string, following: boolean, matcher: PlayersMatcher) =>
  matches.filter((m) => matchesQuery(m, q) && (!following || matcher(teamPlayers(m))));

export const buildView = (
  dayMatches: Match[],
  base: Match[],
  events: EventCode[],
  courts: number[],
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
  const upcoming = toSection(list.filter(isUpcoming), clock);
  const results = toSection(list.filter(isSettled), clock);
  return {
    evChips,
    courtChips,
    upcoming,
    results,
    liveIn: list.length - upcoming.count - results.count,
    next: nextPerCourt(dayMatches),
  };
};
