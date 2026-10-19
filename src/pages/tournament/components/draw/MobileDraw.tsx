import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FC } from 'react';

import { Segmented } from '~/components/ui';
import { headerOffset, tabbarHeight } from '~/utils/layout';
import { inlineSign, scrollBehavior } from '~/utils/scroll';

import type { Bracket } from './bracket';
import { BracketView } from './BracketView';

const SETTLE_MS = 150;
const ALIGNED_PX = 2;
const VIEW_MARGIN = 12;

const columnsOf = (el: HTMLElement) => Array.from(el.firstElementChild?.children ?? []);

const offsetsOf = (el: HTMLElement) => {
  const rtl = inlineSign(el) < 0;
  const r = el.getBoundingClientRect();
  const pad = Number.parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0;
  const edge = rtl ? r.right - pad : r.left + pad;
  return columnsOf(el).map((c) => {
    const b = c.getBoundingClientRect();
    return rtl ? edge - b.right : b.left - edge;
  });
};

const nearestOf = (offsets: number[]) =>
  offsets.reduce((best, o, i) => (Math.abs(o) < Math.abs(offsets[best] ?? Infinity) ? i : best), 0);

const closest = (ys: number[], from: number, to: number, y: number) => {
  let best = from;
  for (let j = from + 1; j < Math.min(to, ys.length); j++) {
    if (Math.abs((ys[j] ?? 0) - y) < Math.abs((ys[best] ?? 0) - y)) best = j;
  }
  return best;
};

const follow = (el: HTMLElement, bracket: Bracket, from: number, to: number) => {
  const body = columnsOf(el)[to]?.lastElementChild;
  if (!body) return;
  const top = headerOffset() + tabbarHeight(el);
  const bottom = window.innerHeight;
  const { top: y0, bottom: y1 } = body.getBoundingClientRect();
  const lo = Math.max(top, y0);
  const hi = Math.min(bottom, y1);
  if (hi <= lo) return;
  const src = bracket.columns[from]?.ys ?? [];
  const dst = bracket.columns[to]?.ys ?? [];
  const mid = (lo + hi) / 2 - y0;
  const a = closest(src, 0, src.length, mid);
  const d = to - from;
  const t = d > 0 ? a >> d : closest(dst, a << -d, (a + 1) << -d, mid);
  const y = y0 + (dst[t] ?? 0);
  const half = bracket.boxHeight / 2 + VIEW_MARGIN;
  if (y - half >= top && y + half <= bottom) return;
  const want = Math.min(Math.max(y0 + (src[a] ?? 0), top + half), bottom - half);
  window.scrollBy({ top: y - want, behavior: scrollBehavior() });
};

export const MobileDraw: FC<{
  bracket: Bracket;
  round: number;
  onRound: (round: number) => void;
  onOpen: (id: string) => void;
}> = ({ bracket, round, onRound, onOpen }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { columns } = bracket;
  const index = Math.min(round, columns.length - 1);
  const [shown, setShown] = useState(index);
  const settled = useRef<number | null>(null);
  const target = useRef<number | null>(null);
  const latest = useRef({ bracket, index, onRound });
  const options = useMemo(() => columns.map((c, i) => ({ value: String(i), label: c.short, tip: c.label })), [columns]);

  useLayoutEffect(() => {
    latest.current = { bracket, index, onRound };
  });

  const go = useCallback((i: number, instant: boolean) => {
    const el = ref.current;
    if (!el) return;
    const from = settled.current;
    settled.current = i;
    setShown(i);
    if (from !== null && from !== i) follow(el, latest.current.bracket, from, i);
    const d = offsetsOf(el)[i] ?? 0;
    const behavior = scrollBehavior(instant);
    target.current = d && behavior === 'smooth' ? i : null;
    if (d) el.scrollBy({ left: inlineSign(el) * d, behavior });
  }, []);

  useLayoutEffect(() => {
    if (settled.current !== index) go(index, settled.current === null);
  }, [index, go]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let timer = 0;
    const settle = () => {
      window.clearTimeout(timer);
      const offsets = offsetsOf(el);
      const i = nearestOf(offsets);
      if (Math.abs(offsets[i] ?? 0) > ALIGNED_PX) return;
      target.current = null;
      setShown(i);
      if (i === settled.current) return;
      const { bracket: b, index: current, onRound: report } = latest.current;
      const from = settled.current;
      settled.current = i;
      if (from !== null) follow(el, b, from, i);
      if (i !== current) report(i);
    };
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (target.current === null) setShown(nearestOf(offsetsOf(el)));
      });
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', settle);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', settle);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  const select = useCallback(
    (v: string | null) => {
      if (v === null) return;
      const i = Number(v);
      go(i, false);
      onRound(i);
    },
    [go, onRound],
  );

  return (
    <>
      <Segmented options={options} value={String(shown)} onChange={select} />
      <BracketView ref={ref} bracket={bracket} onOpen={onOpen} snap />
    </>
  );
};
