import { msg } from '@lingui/core/macro';

import { Continent, EntryStage, EventCode } from '~/api/schemas';
import { EVENT_NAMES } from '~/constants';
import type { PlayerDirectory } from '~/hooks/usePlayers';
import { lazyRecord } from '~/i18n/lazy';
import type { DrawSlot, EntryListing, Match, Side, SideResult, Team } from '~/types';
import { continentOf, countryName } from '~/utils/countries';
import { isDoubles, isMainDraw, latestByTeam, sideStatus, teamEventKey, teamMatchesQuery } from '~/utils/matches';
import { worldRank } from '~/utils/rankings';

export interface LatestEntry {
  key: string;
  event: EventCode;
  team: Team;
  match: Match | null;
  side: Side;
  stage: EntryStage;
  qualifier: boolean;
  listedRank: number | null;
}

export interface Entry extends LatestEntry {
  rank: number;
}

export interface CountryGroup {
  cc: string;
  name: string;
  entries: Entry[];
}

export interface ContinentGroup {
  name: Continent;
  count: number;
  countries: CountryGroup[];
}

export interface StageGroup {
  stage: EntryStage;
  label: string;
  seeded: Entry[];
  rest: Entry[];
}

export interface EventSection {
  event: EventCode;
  name: string;
  count: number;
  seeds: number;
  groups: StageGroup[];
}

export interface EntryFilters {
  ev: EventCode | undefined;
  q: string;
  top10: boolean;
}

export const disciplineId = (event: EventCode) => `entries-${event}`;

const NO_MATCHES: Match[] = [];

const MAIN_DRAW = msg({
  message: 'Main draw',
  comment: 'Entry status: in the main draw, the knockout bracket proper (as opposed to qualifying)',
});

const QUALIFYING = msg({
  message: 'Qualifying',
  comment: 'Entry status: plays the qualifying rounds, played before the main draw to fill its last places',
});

const WITHDRAWN = msg({ message: 'Withdrawn', comment: 'Entry status: pulled out of the tournament before playing' });

const STAGE_LABELS: Readonly<Record<EntryStage, string>> = lazyRecord({
  main: MAIN_DRAW,
  qual: QUALIFYING,
  reserve: msg({
    message: 'Alternate',
    comment: 'Entry status: a reserve player or pair who only gets in if someone withdraws',
  }),
  withdrawn: WITHDRAWN,
});

const STAGE_GROUPS: Readonly<Record<EntryStage, string>> = lazyRecord({
  main: MAIN_DRAW,
  qual: QUALIFYING,
  reserve: msg({
    message: 'Alternates',
    comment: 'Players tab group heading: reserve players or pairs who only get in if someone withdraws',
  }),
  withdrawn: WITHDRAWN,
});

const STAGE_TONES: Record<EntryStage, SideResult> = { main: 'up', qual: 'up', reserve: 'lost', withdrawn: 'lost' };

const STATUS_OPTS = { court: true };

export const entryStatus = (e: LatestEntry): { tone: SideResult; label: string } =>
  e.match ? sideStatus(e.match, e.side, STATUS_OPTS) : { tone: STAGE_TONES[e.stage], label: STAGE_LABELS[e.stage] };

const qualifyingKeys = (matches: readonly Match[]) =>
  new Set(matches.filter((m) => !isMainDraw(m)).flatMap((m) => m.teams.map((t) => teamEventKey(m.event, t.key))));

const listedStage = (stage: EntryStage, drawn: boolean, drawOut: boolean): EntryStage => {
  if (drawn && (stage === 'qual' || stage === 'reserve')) return 'main';
  if (!drawn && drawOut && stage === 'main') return 'withdrawn';
  return stage;
};

export const latestEntries = (
  matches: readonly Match[],
  draw: readonly DrawSlot[] | null,
  listed: readonly EntryListing[] | undefined,
): LatestEntry[] => {
  const drawn = latestByTeam(draw?.map((s) => s.match) ?? NO_MATCHES);
  const drawnEvents = new Set([...drawn.values()].map((d) => d.match.event));
  const viaQual = qualifyingKeys(matches);
  const out = new Map<string, LatestEntry>();
  for (const { event, stage, rank, team } of listed ?? []) {
    const key = teamEventKey(event, team.key);
    const d = drawn.get(key);
    out.set(key, {
      key,
      event,
      team: d?.team ?? team,
      match: null,
      side: 0,
      stage: listedStage(stage, !!d, drawnEvents.has(event)),
      qualifier: !!d && stage === 'qual',
      listedRank: rank,
    });
  }
  for (const [key, { match, team }] of drawn)
    if (!out.has(key))
      out.set(key, {
        key,
        event: match.event,
        team,
        match: null,
        side: 0,
        stage: 'main',
        qualifier: false,
        listedRank: null,
      });
  for (const [key, { match, team, side }] of latestByTeam(matches)) {
    const prev = out.get(key);
    const main = isMainDraw(match);
    out.set(key, {
      key,
      event: match.event,
      team,
      match,
      side,
      stage: main ? 'main' : 'qual',
      qualifier: main && (!!prev?.qualifier || prev?.stage === 'qual' || viaQual.has(key)),
      listedRank: prev?.listedRank ?? null,
    });
  }
  return [...out.values()];
};

const pairRank = (e: LatestEntry) => (isDoubles(e.event) ? (e.listedRank ?? 0) : 0);

export const rankEntries = (entries: LatestEntry[], dir: PlayerDirectory | undefined): Entry[] =>
  entries.map((e) => ({
    ...e,
    rank: pairRank(e) || worldRank(dir, e.team.players, e.event) || (e.listedRank ?? 0),
  }));

const byRank = (a: Entry, b: Entry) => (a.rank || 1e6) - (b.rank || 1e6);

const byRankThenEvent = (a: Entry, b: Entry) =>
  byRank(a, b) || EventCode.options.indexOf(a.event) - EventCode.options.indexOf(b.event);

const bySeedThenRank = (a: Entry, b: Entry) => (a.team.seed || 1e3) - (b.team.seed || 1e3) || byRank(a, b);

const isAttending = (e: Entry) => e.stage === 'main' || e.stage === 'qual';

const passes = (e: Entry, { q, top10 }: Pick<EntryFilters, 'q' | 'top10'>) =>
  (!top10 || (e.rank > 0 && e.rank <= 10)) && teamMatchesQuery(e.team, q);

export const groupEntries = (entries: Entry[], filters: EntryFilters): ContinentGroup[] => {
  const visible = entries.filter(
    (e) => isAttending(e) && (!filters.ev || e.event === filters.ev) && passes(e, filters),
  );
  const byCountry = Map.groupBy(visible, (e) => e.team.players[0]?.cc ?? '');
  const countries = [...byCountry].map(([cc, list]): CountryGroup => ({
    cc,
    name: countryName(cc),
    entries: list.sort(byRankThenEvent),
  }));
  return Continent.options
    .map((name): ContinentGroup => {
      const cs = countries
        .filter((c) => continentOf(c.cc) === name)
        .sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name));
      return { name, count: cs.reduce((n, c) => n + c.entries.length, 0), countries: cs };
    })
    .filter((c) => c.countries.length)
    .sort((a, b) => b.count - a.count);
};

const stageGroup = (stage: EntryStage, list: readonly Entry[]): StageGroup => {
  const rows = list.filter((e) => e.stage === stage).sort(bySeedThenRank);
  return {
    stage,
    label: STAGE_GROUPS[stage],
    seeded: rows.filter((e) => e.team.seed),
    rest: rows.filter((e) => !e.team.seed),
  };
};

export const sectionEntries = (entries: Entry[], filters: Pick<EntryFilters, 'q' | 'top10'>): EventSection[] =>
  EventCode.options
    .map((event): EventSection => {
      const list = entries.filter((e) => e.event === event && passes(e, filters));
      const groups = EntryStage.options
        .map((stage) => stageGroup(stage, list))
        .filter((g) => g.seeded.length + g.rest.length > 0);
      const main = groups.find((g) => g.stage === 'main');
      return {
        event,
        name: EVENT_NAMES[event],
        count: list.filter(isAttending).length,
        seeds: main?.seeded.length ?? 0,
        groups,
      };
    })
    .filter((s) => s.groups.length > 0);
