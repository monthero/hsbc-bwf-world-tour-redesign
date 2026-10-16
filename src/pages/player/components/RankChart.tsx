import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { memo, useCallback, useMemo, useState, type ChangeEvent, type PointerEvent } from 'react';

import { Partner } from '~/components/player';
import { Segmented } from '~/components/ui';
import { useLazyOptions, type LazyOption } from '~/i18n/useLazyOptions';
import { dayjs, formatDayMonthYear, formatMonthYear } from '~/utils/dates';
import { formatNumber, formatRank } from '~/utils/format';

import type { RankPoint } from '../types';

import classes from './RankChart.module.css';

type Range = 'all' | 'recent';

interface Tick {
  key: string;
  pos: number;
  label: string;
}

interface Model {
  path: string;
  xs: number[];
  ys: number[];
  yTicks: Tick[];
  xTicks: Tick[];
  high: number;
  right: number;
}

const PAD = { top: 12, right: 14, bottom: 24, left: 42 };
const NICE = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
const POWERS = new Set([1, 10, 100, 1000, 10000]);
const MAX_Y_TICKS = 5;
const WEEK_MS = 7 * 86_400_000;
const YEAR_MS = 52 * WEEK_MS;
const GAP_MS = 5 * WEEK_MS;
const RECENT_MS = 2 * YEAR_MS;
const RANGE_MIN_MS = 3 * YEAR_MS;
const YEAR_GAP = 44;
const LABEL_EDGE = 56;

const RANGE_OPTIONS: readonly LazyOption<Range>[] = [
  { value: 'all', label: msg({ message: 'Career', comment: 'Ranking chart range: the player’s whole career' }) },
  { value: 'recent', label: msg({ message: 'Last 2 years', comment: 'Ranking chart range: the last two years only' }) },
];

const niceFloor = (n: number) => NICE.findLast((v) => v <= n) ?? 1;

const niceCeil = (n: number) => NICE.find((v) => v >= n) ?? n;

const yTicksOf = (lo: number, hi: number) => {
  const all = NICE.filter((v) => v >= lo && v <= hi);
  return all.length > MAX_Y_TICKS ? all.filter((v) => POWERS.has(v)) : all;
};

const xTicksOf = (t0: number, t1: number, x: (t: number) => number, width: number): Tick[] => {
  const span = t1 - t0;
  const step = Math.max(1, Math.ceil(YEAR_GAP / ((width * YEAR_MS) / Math.max(span, 1))));
  const ticks: Tick[] = [];
  for (let d = dayjs.utc(t0).add(1, 'year').startOf('year'); d.valueOf() <= t1; d = d.add(1, 'year'))
    if (d.year() % step === 0) ticks.push({ key: `x${d.year()}`, pos: x(d.valueOf()), label: String(d.year()) });
  return ticks.length ? ticks : [{ key: 'x0', pos: x(t0), label: formatMonthYear(dayjs.utc(t0).toISOString()) }];
};

const modelOf = (points: readonly RankPoint[], width: number, height: number): Model => {
  const w = width - PAD.left - PAD.right;
  const h = height - PAD.top - PAD.bottom;
  const ranks = points.map((p) => p.rank);
  const best = Math.min(...ranks);
  const lo = niceFloor(best);
  const hi = Math.max(niceCeil(Math.max(...ranks)), NICE[NICE.indexOf(lo) + 1] ?? lo * 2);
  const scale = Math.log(hi / lo);
  const y = (r: number) => PAD.top + (Math.log(r / lo) / scale) * h;
  const t0 = points[0]?.time ?? 0;
  const t1 = points.at(-1)?.time ?? t0;
  const span = t1 - t0;
  const x = (t: number) => PAD.left + (span ? ((t - t0) / span) * w : w / 2);
  const xs = points.map((p) => x(p.time));
  const ys = points.map((p) => y(p.rank));
  const path = points
    .map((p, i) => {
      const at = `${(xs[i] ?? 0).toFixed(1)},${(ys[i] ?? 0).toFixed(1)}`;
      const prev = points[i - 1];
      return prev && p.time - prev.time <= GAP_MS ? `L${at}` : `M${at}l0,0`;
    })
    .join('');
  return {
    path,
    xs,
    ys,
    yTicks: yTicksOf(lo, hi).map((v) => ({ key: `y${v}`, pos: y(v), label: `#${v}` })),
    xTicks: xTicksOf(t0, t1, x, w),
    high: ranks.indexOf(best),
    right: width - PAD.right,
  };
};

const nearest = (xs: readonly number[], at: number) => {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((xs[mid] ?? 0) < at) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && at - (xs[lo - 1] ?? 0) < (xs[lo] ?? 0) - at ? lo - 1 : lo;
};

const describe = (i18n: I18n, p: RankPoint) => {
  const day = formatDayMonthYear(p.date);
  const rank = formatRank(p.rank);
  const points = formatNumber(p.points);
  return i18n._(
    msg({
      message: `${day}: ${rank}, ${points} points`,
      comment: 'Screen-reader value of the ranking history slider: date, world ranking (e.g. #3) and ranking points',
    }),
  );
};

export const RankChart = memo<{ points: readonly RankPoint[]; live: boolean }>(({ points, live }) => {
  const [range, setRange] = useState<Range>('all');
  const pick = useCallback((v: Range | null) => v && setRange(v), []);
  const options = useLazyOptions(RANGE_OPTIONS);
  const long = (points.at(-1)?.time ?? 0) - (points[0]?.time ?? 0) > RANGE_MIN_MS;
  const shown = useMemo(() => {
    const end = points.at(-1)?.time ?? 0;
    return long && range === 'recent' ? points.filter((p) => p.time >= end - RECENT_MS) : points;
  }, [points, long, range]);
  return (
    <div className={classes.chart}>
      {long && <Segmented options={options} value={range} onChange={pick} height={28} className={classes.range} />}
      <ChartBody key={range} points={shown} live={live} />
    </div>
  );
});

const ChartBody = memo<{ points: readonly RankPoint[]; live: boolean }>(({ points, live }) => {
  const { t, i18n } = useLingui();
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const model = useMemo(() => (width && height ? modelOf(points, width, height) : null), [points, width, height]);
  const [active, setActive] = useState<number | null>(null);
  const last = points.length - 1;
  const shown = active ?? last;
  const point = points[shown];
  const move = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!model) return;
      setActive(nearest(model.xs, e.clientX - e.currentTarget.getBoundingClientRect().left));
    },
    [model],
  );
  const leave = useCallback((e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') setActive(null);
  }, []);
  const slide = useCallback((e: ChangeEvent<HTMLInputElement>) => setActive(Number(e.target.value)), []);
  const highX = model?.xs[model.high] ?? 0;
  const highY = model?.ys[model.high] ?? 0;
  const highLeft = model ? highX > model.right - LABEL_EDGE : false;
  return (
    <>
      {point && <Readout point={point} />}
      <div ref={ref} className={classes.frame} dir="ltr">
        <VisuallyHidden>
          <input
            type="range"
            min={0}
            max={last}
            value={shown}
            aria-label={t({
              message: 'World ranking history',
              comment: 'Accessible label of the slider that steps through the ranking chart week by week',
            })}
            aria-valuetext={point ? describe(i18n, point) : undefined}
            onChange={slide}
          />
        </VisuallyHidden>
        {model && (
          <svg
            className={classes.svg}
            width={width}
            height={height}
            aria-hidden
            onPointerMove={move}
            onPointerDown={move}
            onPointerLeave={leave}
          >
            {model.yTicks.map((tick) => (
              <g key={tick.key}>
                <line className={classes.grid} x1={PAD.left} x2={model.right} y1={tick.pos} y2={tick.pos} />
                <text className={classes.yLabel} x={PAD.left - 8} y={tick.pos}>
                  {tick.label}
                </text>
              </g>
            ))}
            {model.xTicks.map((tick) => (
              <text key={tick.key} className={classes.xLabel} x={tick.pos} y={height - 6}>
                {tick.label}
              </text>
            ))}
            <path className={classes.line} d={model.path} />
            {active !== null && (
              <line
                className={classes.cross}
                x1={model.xs[active]}
                x2={model.xs[active]}
                y1={PAD.top}
                y2={height - PAD.bottom}
              />
            )}
            {model.high !== last && (
              <g>
                <circle className={classes.high} cx={highX} cy={highY} r={4} />
                <text
                  className={classes.highLabel}
                  x={highLeft ? highX - 8 : highX + 8}
                  y={highY}
                  data-left={highLeft || undefined}
                >
                  {formatRank(points[model.high]?.rank)}
                </text>
              </g>
            )}
            <circle
              className={classes.end}
              cx={model.xs[last]}
              cy={model.ys[last]}
              r={4}
              data-live={live || undefined}
              data-high={model.high === last || undefined}
            />
            {active !== null && active !== last && (
              <circle className={classes.focus} cx={model.xs[active]} cy={model.ys[active]} r={4} />
            )}
          </svg>
        )}
      </div>
    </>
  );
});

const Readout = memo<{ point: RankPoint }>(({ point: p }) => {
  const points = formatNumber(p.points);
  return (
    <div className={classes.readout}>
      <span className={classes.when}>{formatDayMonthYear(p.date)}</span>
      <b className={classes.rank}>{formatRank(p.rank)}</b>
      <span className={classes.points}>
        <Trans comment="World ranking points at the chosen week; pts = points">{points} pts</Trans>
      </span>
      {p.partner && <Partner player={p.partner} className={classes.with} />}
    </div>
  );
});
