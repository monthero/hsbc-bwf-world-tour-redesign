import type { CSSProperties } from 'react';

import { EventCode, Level } from '~/api/schemas';
import type { BioView, Player, PlayerDirectory, PlayerMatch, RankingHistory, RankView, SeasonIndex } from '~/types';
import { formatDayMonthYear } from '~/utils/dates';
import { formatRank } from '~/utils/format';
import { medalOfResult } from '~/utils/medals';
import { compareText } from '~/utils/names';
import { opponentsOf, ownTeam, playerById, winLoss } from '~/utils/season';

import { LOSS_RESULT, RESULT_LABELS } from './constants';
import type {
  BreakdownItem,
  CareerHigh,
  CareerView,
  EventRun,
  HistoryGroup,
  HistoryRow,
  HistoryView,
  MedalCounts,
  PartnerRow,
  ResultGroup,
  SeasonView,
  TournamentRuns,
  WinLoss,
  RivalRow,
  LevelRecord,
  SeasonBreakdown,
} from './types';

type HistoryEntry = RankingHistory['history'][number];

export const resultLabel = (n: number) => RESULT_LABELS[n] ?? formatRank(n);

export const resultTier = (n: number) => medalOfResult(n) ?? (n === 5 ? 'qf' : 'other');

export const medalCounts = (items: readonly BreakdownItem[]): MedalCounts => {
  const counts: MedalCounts = { gold: 0, silver: 0, bronze: 0 };
  for (const t of items) {
    const kind = medalOfResult(t.result);
    if (kind) counts[kind]++;
  }
  return counts;
};

const partnerOf = (r: HistoryEntry, self: string, index: SeasonIndex | undefined, dir: PlayerDirectory | undefined) => {
  if (!r.player2Id) return null;
  const mine = String(r.player1Id) === self;
  const name = (mine ? r.player2Name : r.player1Name) ?? '';
  if (!name) return null;
  return playerById(String((mine ? r.player2Id : r.player1Id) ?? ''), name, index, dir);
};

export const buildHistory = (
  h: RankingHistory,
  index: SeasonIndex | undefined,
  dir: PlayerDirectory | undefined,
): HistoryView => {
  const rows = h.history.flatMap((r, i) => {
    if (!r.event) return [];
    const row: HistoryRow = {
      key: `h${i}`,
      partner: partnerOf(r, h.id, index, dir),
      rank: r.rank,
      best: r.highestRank || r.rank,
      date: r.date ? formatDayMonthYear(r.date) : '',
      weeks: r.totalWeeks,
      current: false,
    };
    return [{ r, ev: r.event, live: r.publicationId === h.publicationId, row }];
  });
  const bestLive = new Map<EventCode, (typeof rows)[number]>();
  for (const x of rows) {
    const cur = bestLive.get(x.ev);
    if (x.live && (!cur || x.r.rank < cur.r.rank)) bestLive.set(x.ev, x);
  }
  for (const x of bestLive.values()) x.row.current = true;

  const results: ResultGroup[] = rows
    .filter((x) => x.live)
    .sort((a, b) => a.r.rank - b.r.rank)
    .map((x) => ({
      key: x.row.key,
      ev: x.ev,
      partner: x.row.partner,
      items: x.r.breakdown.map((t, j) => ({
        key: `${x.row.key}-${j}`,
        name: t.tournament.replaceAll('&amp;', '&'),
        yearWeek: `${t.year} · wk ${t.week}`,
        result: t.result,
        points: t.points,
        counted: t.counted,
      })),
    }));

  const groups = [...Map.groupBy(rows, (x) => x.ev)]
    .map(([ev, xs]) => {
      xs.sort((a, b) => (b.r.date ?? '').localeCompare(a.r.date ?? '') || a.r.rank - b.r.rank);
      const live = xs.filter((y) => y.live).map((y) => y.r.rank);
      return {
        group: { ev, rows: xs.map((y) => y.row) } satisfies HistoryGroup,
        cur: live.length ? Math.min(...live) : Infinity,
        best: Math.min(...xs.map((y) => y.r.rank || Infinity)),
        last: xs[0]?.r.date ?? '',
      };
    })
    .sort((a, b) => a.cur - b.cur || a.best - b.best || b.last.localeCompare(a.last))
    .map((g) => g.group);

  return { groups, results };
};

const isTitle = (pm: PlayerMatch) => pm.match.round === 'F' && pm.outcome === 'W';

const matchResult = (pm: PlayerMatch) => {
  if (isTitle(pm)) return 1;
  return pm.outcome === 'L' ? LOSS_RESULT[pm.match.round] : undefined;
};

export const bestResult = (list: readonly PlayerMatch[]) => {
  let best: number | null = null;
  for (const pm of list) {
    const r = matchResult(pm);
    if (r && (best === null || r < best)) best = r;
  }
  return best;
};

const runKey = (pm: PlayerMatch) => `${pm.tournament.code}|${pm.match.event}`;

export const careerOf = (matches: readonly PlayerMatch[]): CareerView => {
  const counts: MedalCounts = { gold: 0, silver: 0, bronze: 0 };
  const seasons = [...Map.groupBy(matches, (pm) => pm.tournament.year)]
    .sort(([a], [b]) => b - a)
    .map(([year, list]): SeasonView => {
      const [wins, losses] = winLoss(list);
      let titles = 0;
      let best: number | null = null;
      for (const run of Map.groupBy(list, runKey).values()) {
        const r = bestResult(run);
        if (r === null) continue;
        const kind = medalOfResult(r);
        if (kind) counts[kind]++;
        if (r === 1) titles++;
        if (best === null || r < best) best = r;
      }
      return { year, matches: list, wins, losses, titles, best };
    });
  return {
    seasons,
    wins: seasons.reduce((n, s) => n + s.wins, 0),
    losses: seasons.reduce((n, s) => n + s.losses, 0),
    counts,
    titles: matches.filter(isTitle),
  };
};

export const eventsOf = (matches: readonly PlayerMatch[]) => {
  const seen = new Set(matches.map((pm) => pm.match.event));
  return EventCode.options.filter((ev) => seen.has(ev));
};

export const teammateOf = (pm: PlayerMatch, self: string) => {
  const { players } = ownTeam(pm);
  return players.length > 1 ? (players.find((p) => p.id !== self) ?? null) : null;
};

const eventRun = (event: EventCode, matches: PlayerMatch[], self: string): EventRun => {
  const partners = new Map<string, Player>();
  for (const pm of matches) {
    const p = teammateOf(pm, self);
    if (p) partners.set(p.id || p.name, p);
  }
  const [only] = partners.values();
  return {
    key: event,
    event,
    partner: partners.size === 1 && only ? only : null,
    perMatch: partners.size > 1,
    result: bestResult(matches),
    matches,
  };
};

export const tournamentRuns = (matches: readonly PlayerMatch[], self: string): TournamentRuns[] =>
  [...Map.groupBy(matches, (pm) => pm.tournament.code)].flatMap(([key, list]) => {
    const tournament = list[0]?.tournament;
    if (!tournament) return [];
    const runs = [...Map.groupBy(list, (pm) => pm.match.event)].map(([ev, xs]) => eventRun(ev, xs, self));
    return [{ key, tournament, runs }];
  });

export const partnerHistory = (matches: readonly PlayerMatch[], self: string): PartnerRow[] => {
  const rows = new Map<string, PartnerRow>();
  for (const pm of matches) {
    const partner = teammateOf(pm, self);
    if (!partner) continue;
    const { event, round } = pm.match;
    const year = pm.tournament.year;
    const key = `${event}|${partner.id || partner.name}`;
    const row = rows.get(key) ?? {
      key,
      event,
      partner,
      first: year,
      last: year,
      matches: 0,
      wins: 0,
      losses: 0,
      titles: 0,
      finals: 0,
    };
    rows.set(key, row);
    row.first = Math.min(row.first, year);
    row.last = Math.max(row.last, year);
    row.matches++;
    if (pm.outcome === 'W') row.wins++;
    if (pm.outcome === 'L') row.losses++;
    if (round === 'F' && (pm.outcome === 'W' || pm.outcome === 'L')) row.finals++;
    if (isTitle(pm)) row.titles++;
  }
  return [...rows.values()].sort((a, b) => b.last - a.last || b.matches - a.matches);
};

const highOf = (k: RankView, view: HistoryView | undefined): CareerHigh | null => {
  let best: HistoryRow | undefined;
  for (const row of view?.groups.find((g) => g.ev === k.ev)?.rows ?? []) {
    if (row.best && (!best || row.best < best.best || (row.best === best.best && (row.weeks ?? 0) > (best.weeks ?? 0))))
      best = row;
  }
  if (best) return { rank: best.best, weeks: best.weeks, partner: best.partner };
  return k.highest ? { rank: k.highest, weeks: null, partner: k.highestPartner } : null;
};

export const careerHighs = (ranks: readonly RankView[], view: HistoryView | undefined) =>
  new Map(
    ranks.flatMap((k) => {
      const high = highOf(k, view);
      return high ? [[k.ev, high] as const] : [];
    }),
  );

export const yearRange = (first: number, last: number) => (first === last ? String(first) : `${first}–${last}`);

export const winShare = (wins: number, losses: number) => (wins + losses ? wins / (wins + losses) : null);

export const winRate = (wins: number, losses: number) => {
  const share = winShare(wins, losses);
  return share === null ? '—' : `${Math.round(share * 100)}%`;
};

export const decided = (pm: PlayerMatch) => pm.outcome === 'W' || pm.outcome === 'L';

export const nextMatchOf = (list: readonly PlayerMatch[]) =>
  list.find((pm) => pm.outcome === 'Live') ?? list.filter((pm) => pm.outcome === 'up').at(-1);

export const lastMatchOf = (list: readonly PlayerMatch[]) => list.find(decided);

export const shareVars = (value: number, max: number, min = 0) =>
  ({ '--v': `${Math.max(min, max ? Math.round((value / max) * 100) : 0)}%` }) as CSSProperties;

export const finalsOf = (career: CareerView) => career.counts.gold + career.counts.silver;

export const tournamentsOf = (season: SeasonView) => new Set(season.matches.map((pm) => pm.tournament.code)).size;

const tally = (r: WinLoss, pm: PlayerMatch) => {
  if (pm.outcome === 'W') r.wins++;
  else r.losses++;
};

const teamKey = (players: readonly Player[]) =>
  players
    .map((p) => p.id || p.name)
    .toSorted(compareText)
    .join('/');

export const rivalsOf = (matches: readonly PlayerMatch[], repeatMin: number, limit: number): RivalRow[] => {
  const rows = new Map<string, RivalRow>();
  for (const pm of matches) {
    if (!decided(pm)) continue;
    const players = opponentsOf(pm);
    const key = teamKey(players);
    const row = rows.get(key) ?? { key, players, matches: 0, wins: 0, losses: 0 };
    rows.set(key, row);
    row.matches++;
    tally(row, pm);
  }
  const all = [...rows.values()].sort((a, b) => b.matches - a.matches || b.wins - a.wins);
  const repeat = all.filter((r) => r.matches > 1);
  return (repeat.length >= repeatMin ? repeat : all).slice(0, limit);
};

export const seasonBreakdown = (season: SeasonView): SeasonBreakdown => {
  const levels = new Map<Level, LevelRecord>();
  const deciders: WinLoss = { wins: 0, losses: 0 };
  let minutes = 0;
  let timed = 0;
  for (const pm of season.matches) {
    if (!decided(pm)) continue;
    const level = pm.tournament.level;
    const row = levels.get(level) ?? { level, wins: 0, losses: 0 };
    levels.set(level, row);
    tally(row, pm);
    if (pm.match.games.length === 3) tally(deciders, pm);
    if (pm.match.durationMin) {
      minutes += pm.match.durationMin;
      timed++;
    }
  }
  return {
    levels: Level.options.flatMap((l) => {
      const row = levels.get(l);
      return row ? [row] : [];
    }),
    deciders,
    avgMin: timed ? Math.round(minutes / timed) : 0,
  };
};

export const hasProfile = (bio: BioView) =>
  bio.details.length > 0 || bio.links.length > 0 || bio.notes.length > 0 || !!bio.ambition;

export const scopeHistory = (view: HistoryView | undefined, event: EventCode | undefined): HistoryView | undefined =>
  view && event
    ? { groups: view.groups.filter((g) => g.ev === event), results: view.results.filter((g) => g.ev === event) }
    : view;
