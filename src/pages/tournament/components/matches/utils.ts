import { EventCode } from '~/api/schemas';
import type { useFavoritesMatcher } from '~/stores/favorites';
import type { Match } from '~/types';
import { hourOf } from '~/utils/dates';
import { matchesQuery, roundsLabel, teamLabel, teamPlayers } from '~/utils/matches';

export interface MatchGroup {
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

const slotsOf = (list: Match[]) => {
  const slots: { key: string; items: Match[] }[] = [];
  for (const m of list) {
    const key = hourOf(m);
    const last = slots.at(-1);
    if (last?.key === key) last.items.push(m);
    else slots.push({ key, items: [m] });
  }
  return slots;
};

const roundsOf = (items: readonly Match[]) => roundsLabel(items.map((m) => m.round));

const toSection = (list: Match[]): MatchSection => {
  const rounds = roundsOf(list);
  const slots = slotsOf(list).map((s) => ({ ...s, rounds: roundsOf(s.items) }));
  const mixed = slots.some((s) => s.rounds !== rounds);
  return {
    count: list.length,
    rounds: mixed ? '' : rounds,
    groups: slots.map(({ key, items, rounds: r }) => ({
      key,
      items,
      label: mixed ? `From ${key} · ${r}` : `From ${key}`,
    })),
  };
};

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
  const upcoming = toSection(list.filter((m) => m.status === 'N'));
  const results = toSection(list.filter((m) => m.status === 'F'));
  return {
    evChips,
    courtChips,
    upcoming,
    results,
    liveIn: list.length - upcoming.count - results.count,
    nextIds: nextPerCourt(dayMatches),
  };
};
