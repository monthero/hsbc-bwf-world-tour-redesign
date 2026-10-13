import type { CSSProperties } from 'react';

import { LEVEL_META } from '~/constants';
import type { Level, Tournament } from '~/types';
import { date, today } from '~/utils/dates';
import { formatNumber, plural } from '~/utils/format';
import { countdownLabel, finalsOf, isHeld, liveAndNext, liveDayLabel } from '~/utils/tournaments';

import { FLIP_AT, KICKERS, MAP_SIZE, RELAX } from './constants';
import type { MapPoint, PinSpot, SeasonFocus, SeasonStat, SeasonStatus } from './types';

export const posOf = (t: Tournament): MapPoint | null => t.map;

export const anchorVars = (p: MapPoint) => ({ '--fx': p.x / MAP_SIZE.w, '--fy': p.y / MAP_SIZE.h }) as CSSProperties;

export const flipPopover = (p: MapPoint) => p.x / MAP_SIZE.w > FLIP_AT;

export const seasonFocus = (list: readonly Tournament[]): SeasonFocus => {
  const held = list.filter(isHeld);
  const { live, next } = liveAndNext(held);
  const finals = finalsOf(held);
  return { live, next, finals, spot: live ?? next, focus: live ?? next ?? finals ?? held.at(-1) };
};

export const isShown = <T>(shown: readonly T[] | undefined, item: T) => !shown?.length || shown.includes(item);

export const seasonStatusOf = (t: Tournament, f: SeasonFocus): SeasonStatus => {
  if (t.status === 'live' || t === f.spot) return 'next';
  return t.status === 'done' || (t.status === 'cancelled' && t.daysUntil <= 0) ? 'done' : 'up';
};

export const filterSeason = (
  list: Tournament[],
  f: SeasonFocus,
  levels: readonly Level[] | undefined,
  status: readonly SeasonStatus[] | undefined,
) => {
  if (!levels?.length && !status?.length) return list;
  return list.filter((t) => isShown(levels, t.level) && isShown(status, seasonStatusOf(t, f)));
};

export const toggleShown = <T>(options: readonly T[], shown: readonly T[] | undefined, item: T) => {
  const next = options.filter((o) => !!shown?.includes(o) !== (o === item));
  return next.length && next.length < options.length ? next : undefined;
};

export const nearestShown = (
  all: readonly Tournament[],
  shown: readonly Tournament[],
  target: Tournament | undefined,
) => {
  if (!target || shown.includes(target)) return target;
  const at = all.indexOf(target);
  return shown.reduce<Tournament | undefined>(
    (best, t) => (!best || Math.abs(all.indexOf(t) - at) < Math.abs(all.indexOf(best) - at) ? t : best),
    undefined,
  );
};

interface Node {
  t: Tournament;
  ax: number;
  ay: number;
  x: number;
  y: number;
}

const pushApart = (a: Node, b: Node, gap: number, seed: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d >= gap) return;
  const ux = d ? dx / d : Math.cos(seed * RELAX.angle);
  const uy = d ? dy / d : Math.sin(seed * RELAX.angle);
  const push = (gap - d) / 2;
  a.x -= ux * push;
  a.y -= uy * push;
  b.x += ux * push;
  b.y += uy * push;
};

export const relaxPins = (list: readonly Tournament[], gap: number): PinSpot[] => {
  const nodes: Node[] = list.flatMap((t) => {
    const p = posOf(t);
    return p ? [{ t, ax: p.x, ay: p.y, x: p.x, y: p.y }] : [];
  });
  for (let it = 0; it < RELAX.iterations; it++) {
    for (const n of nodes) {
      n.x += (n.ax - n.x) * RELAX.spring;
      n.y += (n.ay - n.y) * RELAX.spring;
    }
    nodes.forEach((a, i) => {
      for (let j = i + 1; j < nodes.length; j++) pushApart(a, nodes[j] as Node, gap, i + j);
    });
  }
  return nodes.map((n) => ({
    t: n.t,
    x: n.x,
    y: n.y,
    ax: n.ax,
    ay: n.ay,
    moved: Math.hypot(n.x - n.ax, n.y - n.ay) > gap * RELAX.leader,
  }));
};

export const routePaths = (list: readonly Tournament[]) => {
  const points = list.filter(isHeld).flatMap((t) => {
    const p = posOf(t);
    return p ? [{ p, done: t.status === 'done' }] : [];
  });
  return points.flatMap(({ p: b, done }, i) => {
    const a = points[i - 1]?.p;
    if (!a) return [];
    const lift = Math.hypot(b.x - a.x, b.y - a.y) * 0.2;
    return [{ key: `${i}`, done, d: `M${a.x} ${a.y}Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - lift} ${b.x} ${b.y}` }];
  });
};

const compactMoney = (n: number) =>
  n >= 1e6 ? { value: `$${(n / 1e6).toFixed(1)}`, unit: 'M' } : { value: `$${formatNumber(n)}`, unit: undefined };

export const seasonStats = (list: readonly Tournament[], f: SeasonFocus): SeasonStat[] => {
  const held = list.filter(isHeld);
  const countries = new Set(held.map((t) => t.country)).size;
  const prize = compactMoney(held.reduce((s, t) => s + t.prize, 0));
  const done = held.filter((t) => t.status === 'done').length;
  const finalsAhead = f.finals && f.finals.daysUntil > 0;
  return [
    { key: 'stops', value: formatNumber(held.length), label: 'Stops incl. Finals' },
    { key: 'countries', value: formatNumber(countries), label: 'Host countries' },
    { key: 'prize', ...prize, label: 'Prize money' },
    finalsAhead
      ? { key: 'finals', value: formatNumber(f.finals?.daysUntil ?? 0), label: 'Days to the Finals', gold: true }
      : { key: 'done', value: formatNumber(done), label: 'Events completed', gold: true },
  ];
};

export const seasonLede = (list: readonly Tournament[]) => {
  const held = list.filter(isHeld);
  const tournaments = held.filter((t) => t.level !== 'Finals').length;
  const countries = new Set(held.map((t) => t.country)).size;
  return `A season-long circuit of ${plural(tournaments, 'tournament')} and the Finals across ${plural(countries, 'country', 'countries')}, bringing the world’s best together in five disciplines. Every stop feeds the race to the World Tour Finals in December.`;
};

export const yearSpan = (year: number) => {
  const start = date(`${year}-01-01`);
  return { start, days: start.add(1, 'year').diff(start, 'day') };
};

export const stripBox = (t: Tournament, span: ReturnType<typeof yearSpan>) => ({
  left: `${(date(t.start).diff(span.start, 'day') / span.days) * 100}%`,
  width: `${(t.totalDays / span.days) * 100}%`,
});

export const todayOffset = (span: ReturnType<typeof yearSpan>) => {
  const d = today().diff(span.start, 'day');
  return d >= 0 && d < span.days ? `${(d / span.days) * 100}%` : null;
};

export const monthTicks = (span: ReturnType<typeof yearSpan>) =>
  Array.from({ length: 12 }, (_, m) => {
    const d = span.start.add(m, 'month');
    return { month: m, label: d.format('MMM'), style: { left: `${(d.diff(span.start, 'day') / span.days) * 100}%` } };
  });

export const kickerOf = (t: Tournament, f: SeasonFocus) => {
  if (t === f.finals) return KICKERS.finals;
  if (t.status === 'live') return KICKERS.live;
  if (t === f.next) return KICKERS.next;
  if (t.status === 'done') return KICKERS.done;
  return t.status === 'cancelled' ? KICKERS.cancelled : LEVEL_META[t.level].label;
};

export const shortStatus = (t: Tournament) => {
  if (t.status === 'done') return 'Results';
  if (t.status === 'cancelled') return KICKERS.cancelled;
  return t.status === 'live' ? liveDayLabel(t, false) : countdownLabel(t, 'in');
};
