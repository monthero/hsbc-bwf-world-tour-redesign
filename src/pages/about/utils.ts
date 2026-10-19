import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { CSSProperties } from 'react';

import { LEVEL_META } from '~/constants';
import type { PanZoomView } from '~/hooks/usePanZoom';
import { numberFormat } from '~/i18n/current';
import type { Level, Tournament } from '~/types';
import { date, formatWall, today } from '~/utils/dates';
import { formatNumber } from '~/utils/format';
import { countdownLabel, finalsOf, hasWinners, isDone, isHeld, liveAndNext, liveDayLabel } from '~/utils/tournaments';

import {
  FLIP_AT,
  HOME_FRAME,
  KICKERS,
  MAP_SIZE,
  MAP_ZOOM,
  RELAX,
  ROUTE_ARC,
  ROUTE_ARROW,
  SHORT_MONTH,
} from './constants';
import type { MapPoint, PinSpot, RouteLeg, SeasonFocus, SeasonStat, SeasonStatus } from './types';

export const anchorVars = (p: MapPoint) => ({ '--fx': p.x / MAP_SIZE.w, '--fy': p.y / MAP_SIZE.h }) as CSSProperties;

export const flipPopover = (p: MapPoint, view: PanZoomView) => ((p.x - view.x) * view.k) / MAP_SIZE.w + 0.5 > FLIP_AT;

const WORLD_VIEW: PanZoomView = { x: MAP_SIZE.w / 2, y: MAP_SIZE.h / 2, k: 1 };

const fitView = (points: readonly MapPoint[], minSpan: number): PanZoomView => {
  if (!points.length) return WORLD_VIEW;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const w = Math.max((x1 - x0) * HOME_FRAME.pad, minSpan);
  const h = Math.max((y1 - y0) * HOME_FRAME.pad, (minSpan * MAP_SIZE.h) / MAP_SIZE.w);
  const k = Math.min(MAP_ZOOM.homeMax, Math.max(1, Math.min(MAP_SIZE.w / w, MAP_SIZE.h / h)));
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, k };
};

export const homeView = (list: readonly Tournament[], f: SeasonFocus): PanZoomView => {
  const points = list.filter(isHeld).flatMap((t) => (t.map ? [t.map] : []));
  const at = f.spot?.map;
  if (!at) return fitView(points, 0);
  const near = points.filter((p) => Math.hypot(p.x - at.x, p.y - at.y) <= HOME_FRAME.radius);
  return fitView([at, ...near], HOME_FRAME.minSpan);
};

export const seasonFocus = (list: readonly Tournament[]): SeasonFocus => {
  const held = list.filter(isHeld);
  const { live, next } = liveAndNext(held);
  const finals = finalsOf(held);
  return {
    live,
    next,
    finals,
    lastRegular: held.findLast((t) => t.level !== 'Finals'),
    spot: live ?? next,
    focus: live ?? next ?? finals ?? held.at(-1),
  };
};

export const crownedFinals = (f: SeasonFocus) => (f.finals && hasWinners(f.finals) ? f.finals : undefined);

export const raceSettled = (f: SeasonFocus, published: string) => {
  const last = f.lastRegular;
  return !!last && isDone(last) && !date(published).isBefore(date(last.end));
};

const isShown = <T>(shown: readonly T[] | undefined, item: T) => !shown?.length || shown.includes(item);

const seasonStatusOf = (t: Tournament, f: SeasonFocus): SeasonStatus => {
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
    const p = t.map;
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

const isNear = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y) <= ROUTE_ARC.near;

const round = (n: number, step = 10) => Math.round(n * step) / step;

export const routePaths = (list: readonly Tournament[]): RouteLeg[] => {
  const points = list.filter(isHeld).flatMap((t) => {
    const p = t.map;
    return p ? [{ p, done: t.status === 'done' }] : [];
  });
  const legs: { a: MapPoint; b: MapPoint }[] = [];
  return points.flatMap(({ p: b, done }, i) => {
    const a = points[i - 1]?.p;
    const dx = a ? b.x - a.x : 0;
    const dy = a ? b.y - a.y : 0;
    const len = Math.hypot(dx, dy);
    if (!a || !len) return [];
    const twins = legs.filter((l) => isNear(l.a, a) && isNear(l.b, b)).length;
    legs.push({ a, b });
    const bulge = len * (ROUTE_ARC.bend + twins * ROUTE_ARC.spread);
    const nx = dy / len;
    const ny = -dx / len;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const angle = round((Math.atan2(dy, dx) * 180) / Math.PI);
    return [
      {
        key: `${i}`,
        done,
        d: `M${a.x} ${a.y}Q${round(mx + nx * bulge)} ${round(my + ny * bulge)} ${b.x} ${b.y}`,
        arrow: `translate(${round(mx + (nx * bulge) / 2)} ${round(my + (ny * bulge) / 2)}) rotate(${angle})`,
        cap: round(len / (ROUTE_ARROW.span * ROUTE_ARROW.room), 100),
      },
    ];
  });
};

const MILLIONS = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

const compactMoney = (n: number) =>
  n >= 1e6
    ? { value: `$${numberFormat(MILLIONS).format(n / 1e6)}`, unit: 'M' }
    : { value: `$${formatNumber(n)}`, unit: undefined };

const STAT_LABELS = {
  stops: msg({
    message: 'Stops incl. Finals',
    comment:
      'About page headline stat: number of tournaments (“stops”) this season, including the season-ending World Tour Finals',
  }),
  countries: msg({
    message: 'Host countries',
    comment: 'About page headline stat: number of countries hosting a tournament',
  }),
  prize: msg({ message: 'Prize money', comment: 'About page headline stat: total prize money across the season' }),
  finals: msg({
    message: 'Days to the Finals',
    comment: 'About page headline stat: days left until the season-ending World Tour Finals start',
  }),
  done: msg({
    message: 'Events completed',
    comment: 'About page headline stat: number of this season’s tournaments that have finished',
  }),
};

export const seasonStats = (list: readonly Tournament[], f: SeasonFocus): SeasonStat[] => {
  const held = list.filter(isHeld);
  const countries = new Set(held.map((t) => t.country)).size;
  const prize = compactMoney(held.reduce((s, t) => s + t.prize, 0));
  const done = held.filter((t) => t.status === 'done').length;
  const finalsAhead = f.finals && f.finals.daysUntil > 0;
  return [
    { key: 'stops', value: formatNumber(held.length), label: STAT_LABELS.stops },
    { key: 'countries', value: formatNumber(countries), label: STAT_LABELS.countries },
    { key: 'prize', ...prize, label: STAT_LABELS.prize },
    finalsAhead
      ? { key: 'finals', value: formatNumber(f.finals?.daysUntil ?? 0), label: STAT_LABELS.finals, gold: true }
      : { key: 'done', value: formatNumber(done), label: STAT_LABELS.done, gold: true },
  ];
};

const SEASON_LEDE = msg({
  message:
    'A season-long circuit of {tournaments, plural, one {# tournament} other {# tournaments}} and the Finals across {countries, plural, one {# country} other {# countries}}, bringing the world’s best together in five disciplines. Every stop feeds the race to the World Tour Finals in December.',
  comment:
    'Intro under the About page heading. “The Finals” and “World Tour Finals” are the season-ending event for the top 8 per discipline; “the race” is the Race to Finals points table that decides who qualifies',
});

export const seasonLede = (list: readonly Tournament[]) => {
  const held = list.filter(isHeld);
  const tournaments = held.filter((t) => t.level !== 'Finals').length;
  const countries = new Set(held.map((t) => t.country)).size;
  return { ...SEASON_LEDE, values: { tournaments, countries } };
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
    return {
      month: m,
      label: formatWall(d, SHORT_MONTH),
      style: { left: `${(d.diff(span.start, 'day') / span.days) * 100}%` },
    };
  });

export const kickerOf = (i18n: I18n, t: Tournament, f: SeasonFocus) => {
  if (t === f.finals) return i18n._(KICKERS.finals);
  if (t.status === 'live') return i18n._(KICKERS.live);
  if (t === f.next) return i18n._(KICKERS.next);
  if (t.status === 'done') return i18n._(KICKERS.done);
  return t.status === 'cancelled' ? i18n._(KICKERS.cancelled) : LEVEL_META[t.level].label;
};

const RESULTS = msg({
  message: 'Results',
  comment: 'Short status beside a finished tournament on the About page season map; links to its results',
});

export const shortStatus = (i18n: I18n, t: Tournament) => {
  if (t.status === 'done') return i18n._(RESULTS);
  if (t.status === 'cancelled') return i18n._(KICKERS.cancelled);
  return t.status === 'live' ? liveDayLabel(t, false) : countdownLabel(t, 'in');
};
