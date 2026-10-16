import { i18n, type MessageDescriptor } from '@lingui/core';
import { msg, t } from '@lingui/core/macro';

import { EventCode, type NewsItem } from '~/api/schemas';
import { DRAW_SIZE, EVENT_NAMES, GROUP_ROUND_NAMES } from '~/constants';
import { translate } from '~/i18n/lazy';
import type {
  DrawSlot,
  EntryListing,
  Match,
  MedalKind,
  Player,
  PlayerDirectory,
  Series,
  SideResult,
  Team,
  Tournament,
  TournamentDay,
  TournamentSchedule,
  TournamentStatus,
} from '~/types';
import { date, formatDateRange } from '~/utils/dates';
import {
  formatGames,
  isDoubles,
  isMainDraw,
  latestByTeam,
  noteLabel,
  opposite,
  sideStatus,
  teamLabel,
  winnerSide,
  winnerTeam,
} from '~/utils/matches';
import { toPlayer } from '~/utils/names';
import { formatPrize } from '~/utils/tournaments';

import { isBracketMatch } from './components/draw/bracket';
import {
  DAY_ROUNDS,
  DRAW_SEEDS,
  GROUP_STAGE_ROUNDS,
  KNOCKOUT_ROUNDS,
  PODIUM_PLACES,
  PODIUM_PRIZES,
  PRIZE_BASE,
  QUALIFYING_ROUND,
  REST_DAY_LABEL,
  type DayRoundLabel,
} from './constants';
import type { TabAvailability, TournamentTab } from './types';

const DEFAULT_TAB: Record<TournamentStatus, TournamentTab> = {
  done: 'podium',
  live: 'matches',
  up: 'overview',
  cancelled: 'overview',
};

export const resolveTab = (
  tab: TournamentTab | undefined,
  available: TabAvailability | null,
  status: TournamentStatus,
): TournamentTab => {
  const picked = tab ?? DEFAULT_TAB[status];
  return !available || available[picked] ? picked : 'overview';
};

export const tabAvailability = (
  schedule: TournamentSchedule,
  draw: readonly DrawSlot[] | null,
  entries: readonly EntryListing[] | undefined,
  news: readonly NewsItem[] | undefined,
): TabAvailability => {
  const matches = schedule.matches.length > 0;
  const bracket = !!draw || schedule.matches.some(isBracketMatch);
  return {
    overview: true,
    matches,
    draw: bracket,
    players: matches || bracket || !!entries?.length,
    podium: matches,
    media: matches,
    news: !!news?.length,
  };
};

export const mergeDraw = (draw: readonly DrawSlot[], matches: readonly Match[]): DrawSlot[] | null => {
  if (!draw.some((s) => s.match.teams.some((team) => team.players.length > 0))) return null;
  const byId = new Map(matches.map((m) => [m.id, m]));
  return draw.map(({ match, slot }) => ({ match: byId.get(match.id) ?? match, slot }));
};

type DayState = 'done' | 'now' | 'up';

export interface DaySlot {
  key: string;
  day: TournamentDay;
  rest: string | null;
  live: boolean;
}

const restLabel = (run: readonly TournamentDay[]) => {
  const first = run[0]?.shortLabel ?? '';
  const last = run.at(-1)?.shortLabel ?? '';
  return run.length > 1
    ? t({
        message: `Rest days · ${first} – ${last}`,
        comment: 'Tooltip on a run of days without matches. {first} and {last} are short day labels, e.g. "Wed 15"',
      })
    : t({
        message: `Rest day · ${first}`,
        comment: 'Tooltip on a day without matches. {first} is a short day label, e.g. "Wed 15"',
      });
};

export const daySlots = (days: readonly TournamentDay[]): DaySlot[] => {
  const runs: TournamentDay[][] = [];
  for (const d of days) {
    const run = runs.at(-1);
    if (run && d.isRest && run[0]?.isRest) run.push(d);
    else runs.push([d]);
  }
  return runs.flatMap((run) => {
    const day = run[0];
    if (!day) return [];
    return [{ key: day.date, day, rest: day.isRest ? restLabel(run) : null, live: run.some((d) => d.isLive) }];
  });
};

export interface TimelineDay {
  key: string;
  label: string;
  num: string;
  rest: string | null;
  state: DayState;
  long: string;
  short: string;
  expected: boolean;
}

interface RoundLabel {
  long: string;
  short: string;
}

const dayState = (i: number, todayIndex: number, status: TournamentStatus): DayState => {
  if (status === 'done' || i < todayIndex) return 'done';
  return i === todayIndex && status === 'live' ? 'now' : 'up';
};

const NO_GUESSES = new Map<string, RoundLabel>();

const text = (m: MessageDescriptor | string) => (typeof m === 'string' ? m : i18n._(m));

const roundLabel = (l: DayRoundLabel | { long: string; short: string }): RoundLabel => ({
  long: text(l.long),
  short: text(l.short),
});

const dayRounds = (day: TournamentDay): RoundLabel => {
  if (day.isRest) {
    const rest = i18n._(REST_DAY_LABEL);
    return { long: rest, short: rest };
  }
  const labels = [...new Set(day.rounds.filter(Boolean).map((r) => DAY_ROUNDS[r] ?? { long: r, short: r }))].map(
    roundLabel,
  );
  const short = labels.map((l) => l.short).join(' · ');
  return { long: labels.length === 1 ? (labels[0]?.long ?? '') : short, short };
};

const roundLadder = (level: Tournament['level'], rounds: readonly string[]) => {
  if (level === 'Finals' || rounds.some((r) => r in GROUP_ROUND_NAMES)) return GROUP_STAGE_ROUNDS;
  return KNOCKOUT_ROUNDS.slice(KNOCKOUT_ROUNDS.indexOf(rounds.includes('R64') ? 'R64' : `R${DRAW_SIZE}`));
};

const ladderRank = (ladder: readonly string[], round: string) =>
  round in GROUP_ROUND_NAMES ? 0 : ladder.indexOf(round);

const expectedRounds = (level: Tournament['level'], slots: readonly DaySlot[]) => {
  const play = slots.filter((s) => !s.rest);
  const seen = play.flatMap((s) => s.day.rounds);
  const ladder = roundLadder(level, seen);
  const floor = Math.max(0, ...seen.map((r) => ladderRank(ladder, r)));
  const quals = seen.some((round) => !isMainDraw({ round }));
  const guesses = new Map<string, RoundLabel>();
  play.forEach(({ key, day }, i) => {
    if (day.rounds.length) return;
    const round = i === 0 && quals ? QUALIFYING_ROUND : ladder[Math.max(floor, ladder.length - play.length + i)];
    const label = round && DAY_ROUNDS[round];
    if (label) guesses.set(key, roundLabel(label));
  });
  return guesses;
};

export const buildTimeline = (tn: Tournament, schedule: TournamentSchedule): TimelineDay[] => {
  const slots = daySlots(schedule.days);
  const guesses = tn.status === 'up' || tn.status === 'live' ? expectedRounds(tn.level, slots) : NO_GUESSES;
  return slots.map(({ key, day, rest, live }) => {
    const guess = guesses.get(key);
    return {
      key,
      label: day.shortLabel,
      num: day.dayNum,
      rest,
      state: dayState(live ? schedule.todayIndex : day.index, schedule.todayIndex, tn.status),
      expected: !!guess,
      ...(guess ?? dayRounds(day)),
    };
  });
};

export interface ChampionItem {
  event: EventCode;
  players: Player[];
  photos?: (string | null)[];
  score?: string;
}

const finalOf = (matches: Match[], event: EventCode) =>
  matches.find((m) => m.event === event && m.round === 'F' && winnerSide(m) !== null);

export const buildChampions = (schedule: TournamentSchedule): ChampionItem[] =>
  EventCode.options.flatMap((event) => {
    const fm = finalOf(schedule.matches, event);
    const w = fm && winnerTeam(fm);
    return w ? [{ event, players: w.players }] : [];
  });

export interface PastYear {
  key: string;
  year: number;
  meta: string;
  items: ChampionItem[];
}

const pastMeta = (e: Series['editions'][number]) => {
  const dates = formatDateRange(date(e.start), date(e.end), { pad: false });
  const { city, country } = e;
  return t({
    message: `${dates} · ${city}, ${country}`,
    comment: 'Past winners: when and where an earlier edition was held, e.g. "14–19 Oct · Odense, Denmark"',
  });
};

const finalScore = (note: string | null, losers: string, games: string) =>
  note
    ? t({
        message: `${note} · vs. ${losers} · ${games}`,
        comment:
          'Past winners card: how the final ended, who lost it and the game scores, e.g. "Retired · vs. Axelsen · 21–15, 3–1". {note} is Walkover or Retired',
      })
    : t({
        message: `vs. ${losers} · ${games}`,
        comment: 'Past winners card: who lost the final and its game scores, e.g. "vs. Axelsen · 21–15, 21–18"',
      });

export const buildPastWinners = (tn: Tournament, series: Series, dir: PlayerDirectory | undefined): PastYear[] =>
  series.editions
    .filter((e) => e.year < tn.year && !e.cancelled && e.finals.length > 0)
    .map((e) => ({
      key: e.code,
      year: e.year,
      meta: pastMeta(e),
      items: EventCode.options.flatMap((event) => {
        const f = e.finals.find((x) => x.event === event);
        if (!f) return [];
        const losers = f.losers.map((l) => toPlayer(l.name, l.cc, l.id).surname).join(' / ');
        return [
          {
            event,
            players: f.winners.map((w) => toPlayer(w.name, w.cc, w.id)),
            photos: f.winners.map((w) => dir?.get(w.id)?.photo ?? null),
            score: finalScore(noteLabel(f.note, 'long') || f.note, losers, formatGames(f.games)),
          },
        ];
      }),
    }));

export interface PodiumPlace {
  label: string;
  medal: MedalKind;
  prize: string;
  teams: Team[] | null;
}

export interface SeedEntry {
  key: string;
  seed: number;
  team: Team | null;
  match: Match | null;
  tone: SideResult;
  status: string;
  tip: string;
}

export interface PodiumEvent {
  event: EventCode;
  name: string;
  when: string;
  places: PodiumPlace[];
  seedsNote?: string;
  seeds: SeedEntry[];
}

const seedTip = (m: Match) => {
  const w = winnerSide(m);
  if (w === null) return '';
  const l = opposite(w);
  if (!m.teams[l].players.length) return '';
  const winner = teamLabel(m.teams[w], ' & ');
  const loser = teamLabel(m.teams[l], ' & ');
  return [
    t({
      message: `${winner} beat ${loser}`,
      comment: 'Tooltip on a seeded player’s result: who won the match against whom',
    }),
    m.round,
    formatGames(m.games, w),
    noteLabel(m.note, 'long').toLowerCase(),
  ]
    .filter(Boolean)
    .join(' · ');
};

const finalWhen = (day: string | undefined) =>
  day
    ? t({
        message: `Final · ${day}`,
        comment:
          'Podium card heading: the day of the final, e.g. "Final · Sun 19". Final is the last match of an event',
      })
    : t({ message: 'Final', comment: 'Podium card heading: the final, the last match of an event' });

const SEEDS_IN_EVENT = msg({
  message: '{count, plural, one {# seed} other {# seeds}}',
  comment: 'Podium tab, How the seeds did card: number of seeded players or pairs in the event',
});

export const buildPodium = (tn: Tournament, schedule: TournamentSchedule): PodiumEvent[] => {
  const latest = [...latestByTeam(schedule.matches).values()];
  const scale = tn.prize / PRIZE_BASE;
  const lastDay = schedule.days.at(-1);
  return EventCode.options.map((event) => {
    const prizes = isDoubles(event) ? PODIUM_PRIZES.doubles : PODIUM_PRIZES.singles;
    const fm = finalOf(schedule.matches, event);
    const fw = fm ? winnerSide(fm) : null;
    const semis = schedule.matches.filter((m) => m.event === event && m.round === 'SF' && winnerSide(m) !== null);
    const day = (fm && schedule.days[fm.dayIndex]) ?? lastDay;
    const who = [
      fm && fw !== null ? [fm.teams[fw]] : null,
      fm && fw !== null ? [fm.teams[opposite(fw)]] : null,
      semis.length ? semis.map((m) => m.teams[opposite(winnerSide(m) ?? 0)]) : null,
    ];
    const found = latest
      .filter((x) => x.match.event === event && x.team.seed && isMainDraw(x.match))
      .map(({ match, team, side }): SeedEntry => {
        const st = sideStatus(match, side);
        return {
          key: `${match.id}-${side}`,
          seed: team.seed ?? 0,
          team,
          match,
          tone: st.tone,
          status: st.label,
          tip: st.tone === 'won' || st.tone === 'lost' ? seedTip(match) : '',
        };
      });
    const seen = new Set(found.map((s) => s.seed));
    const missing = found.length
      ? Array.from({ length: DRAW_SEEDS }, (_, i) => i + 1)
          .filter((n) => !seen.has(n))
          .map((n): SeedEntry => ({
            key: `missing-${n}`,
            seed: n,
            team: null,
            match: null,
            tone: 'lost',
            status: '',
            tip: '',
          }))
      : [];
    const seeds = [...found, ...missing].sort((a, b) => a.seed - b.seed);
    const count = seeds.length;
    return {
      event,
      name: EVENT_NAMES[event],
      when: finalWhen(day?.shortLabel),
      places: PODIUM_PLACES.map((p, i) => ({
        label: i18n._(p.label),
        medal: p.medal,
        prize: formatPrize(Math.round((prizes[i] ?? 0) * scale)),
        teams: who[i] ?? null,
      })),
      seedsNote: fm ? translate(SEEDS_IN_EVENT, { count }) : undefined,
      seeds,
    };
  });
};
