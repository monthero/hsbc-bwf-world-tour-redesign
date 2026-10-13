import { EventCode } from '~/api/schemas';
import type { useFavoritesMatcher } from '~/stores/favorites';
import type { Match } from '~/types';
import { hourOf } from '~/utils/dates';
import { matchesQuery, matchRoundName, teamLabel, teamPlayers } from '~/utils/matches';

export interface MatchGroup {
  key: string;
  label: string;
  items: Match[];
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
  upcoming: MatchGroup[];
  results: MatchGroup[];
  upCount: number;
  resCount: number;
  liveIn: number;
  nextIds: ReadonlySet<string>;
}

export type PlayersMatcher = ReturnType<typeof useFavoritesMatcher>;

export const matchTitle = (m: Match) => m.teams.map((t) => teamLabel(t)).join(' vs ');

export const centerChild = (el: HTMLElement, child: HTMLElement, behavior: ScrollBehavior = 'auto') =>
  el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior });

export const toggleIn = <T>(list: readonly T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

export const parseEvents = (s: string) => (s ? (s.split(',') as EventCode[]) : []);

export const parseCourts = (s: string) => (s ? s.split(',').map(Number) : []);

const groupBy = (list: Match[], keyOf: (m: Match) => string, labelOf: (m: Match) => string) => {
  const groups: MatchGroup[] = [];
  for (const m of list) {
    const key = keyOf(m);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(m);
    else groups.push({ key, label: labelOf(m), items: [m] });
  }
  return groups;
};

const hourLabel = (m: Match) => `From ${hourOf(m)}`;

const roundKey = (m: Match) => `${m.group ?? ''}${m.round}`;

const byGroupRound = (a: Match, b: Match) =>
  b.round.localeCompare(a.round) || (a.group ?? '').localeCompare(b.group ?? '');

const orderResults = (list: Match[]) => (list.some((m) => m.group) ? list.sort(byGroupRound) : list);

const nextPerCourt = (matches: Match[]) => {
  const seen = new Map<number, string>();
  for (const m of matches) if (m.status === 'N' && !seen.has(m.court)) seen.set(m.court, m.id);
  return new Set(seen.values());
};

export const filterBase = (matches: Match[], q: string, following: boolean, matcher: PlayersMatcher) =>
  matches.filter((m) => matchesQuery(m, q) && (!following || matcher(teamPlayers(m))));

export const buildView = (dayMatches: Match[], base: Match[], events: EventCode[], courts: number[]): MatchesView => {
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
  const up = list.filter((m) => m.status === 'N');
  const res = orderResults(list.filter((m) => m.status === 'F').reverse());
  return {
    evChips,
    courtChips,
    upcoming: groupBy(up, hourOf, hourLabel),
    results: groupBy(res, roundKey, matchRoundName),
    upCount: up.length,
    resCount: res.length,
    liveIn: list.length - up.length - res.length,
    nextIds: nextPerCourt(dayMatches),
  };
};
