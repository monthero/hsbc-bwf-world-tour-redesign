import { BWF_ROUNDS, BWF_STATUSES } from '../../src/api/bwf/codes.ts';
import { wallClock } from '../../src/utils/utc-offset.ts';
import { EVENTS, type ApiMatch, type ApiPlayer, type EventCode } from './bwf.ts';

const WALKOVER = 1;

export interface NormPlayer {
  id: string;
  name: string;
  cc: string;
  slug: string | null;
  photo: string | null;
}

export interface NormMatch {
  id: number;
  code: string | null;
  event: EventCode;
  round: string;
  group: string | null;
  time: string;
  timeUtc: string | null;
  court: number;
  status: string;
  winner: number;
  note: string | null;
  duration: number;
  games: [number, number][];
  seeds: [number | null, number | null];
  teams: [NormPlayer[], NormPlayer[]];
  location: string | null;
  draw: string;
}

const isEvent = (s: string): s is EventCode => (EVENTS as readonly string[]).includes(s);

const PLACEHOLDER_LOCATION = /^(?:main\s+)?location(?:\s*\d+)?$/i;

const locationOf = (s: string | null) => {
  const v = s?.trim();
  return v && !PLACEHOLDER_LOCATION.test(v) ? v : null;
};

const PLACEHOLDER_PHOTO = /profile_(fe)?male/;

export const photoOf = (url: string | null | undefined) => {
  const m = url?.match(/\/(v\d+)\/assets\/players\/thumbnail\/([^/]+)$/);
  return m && !PLACEHOLDER_PHOTO.test(m[2] ?? '') ? `${m[1]}/${m[2]}` : null;
};

const toPlayer = (p: ApiPlayer): NormPlayer => ({
  id: String(p.id),
  name: p.nameDisplay.replace(/\s+/g, ' ').trim(),
  cc: p.countryCode ?? '',
  slug: p.slug ?? null,
  photo: photoOf(p.avatar?.thumbnailUrl),
});

const seed = (s: string | number | null) => {
  const n = Number(String(s ?? '').split('/')[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const normalizeMatch = (m: ApiMatch): NormMatch | null => {
  const event = m.eventName ?? '';
  if (m.isTeamMatch || !isEvent(event)) return null;
  const t1 = m.team1?.players ?? [];
  const t2 = m.team2?.players ?? [];
  if (!t1.length || !t2.length) return null;
  const status = BWF_STATUSES[m.matchStatus] ?? 'N';
  return {
    id: m.id,
    code: m.code,
    event,
    round: BWF_ROUNDS[m.roundName ?? ''] ?? m.roundName ?? '',
    group: m.drawName?.match(/Group\s+(\w+)/i)?.[1] ?? null,
    time: wallClock(m.matchTime),
    timeUtc: m.matchTimeUtc ?? null,
    court: Number(m.courtCode) || (m.courtIndex ?? 0) + 1,
    status: m.winner ? 'F' : status,
    winner: m.winner ?? 0,
    note: m.scoreStatus ? (m.scoreStatusValue ?? null) : null,
    duration: m.duration ?? 0,
    games: m.scoreStatus === WALKOVER ? [] : (m.score ?? []).map((s) => [s.home, s.away]),
    seeds: [seed(m.team1seed), seed(m.team2seed)],
    teams: [t1.map(toPlayer), t2.map(toPlayer)],
    location: locationOf(m.locationName),
    draw: m.drawName ?? event,
  };
};

export const fillMissingRounds = (matches: NormMatch[]) => {
  const counts = new Map<string, Map<string, number>>();
  for (const m of matches) {
    if (!m.round) continue;
    const byRound = counts.get(m.draw) ?? new Map<string, number>();
    byRound.set(m.round, (byRound.get(m.round) ?? 0) + 1);
    counts.set(m.draw, byRound);
  }
  for (const m of matches) {
    if (m.round) continue;
    const best = [...(counts.get(m.draw) ?? [])].sort((a, b) => b[1] - a[1])[0];
    if (best) m.round = best[0];
  }
  return matches;
};

type Game = [number, number];

const validGame = ([a, b]: Game) => {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return lo >= 0 && ((hi === 21 && lo <= 19) || (hi > 21 && hi <= 30 && hi - lo === 2) || (hi === 30 && lo === 29));
};

const matchWinner = (games: Game[]) => {
  const won = [0, 0];
  for (const [a, b] of games) won[a > b ? 0 : 1]++;
  if (won[0] === 2 && won[1] < 2) return 1;
  return won[1] === 2 && won[0] < 2 ? 2 : 0;
};

const decided = (games: Game[]) => games.every(validGame) && matchWinner(games) > 0;

export const repairGames = (games: Game[], rallies: [number, number]) => {
  const d1 = rallies[0] - games.reduce((n, g) => n + g[0], 0);
  const d2 = rallies[1] - games.reduce((n, g) => n + g[1], 0);
  const candidates: Game[][] = [];
  if (!d1 && !d2) candidates.push(games);
  else {
    games.forEach((g, i) => candidates.push(games.with(i, [g[0] + d1, g[1] + d2])));
    candidates.push([...games, [d1, d2]]);
  }
  const valid = candidates.filter(decided);
  const fixed = valid.length === 1 ? valid[0] : undefined;
  return fixed ? { games: fixed, winner: matchWinner(fixed) } : null;
};
