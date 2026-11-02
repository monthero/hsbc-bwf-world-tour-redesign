import { useCallback, useMemo, type FC } from 'react';

import { Segmented } from '~/components/ui';
import { snapPages, useSnapPager } from '~/hooks/useSnapPager';
import { headerOffset, tabbarHeight } from '~/utils/layout';
import { scrollBehavior } from '~/utils/scroll';

import type { Bracket } from './bracket';
import { BracketView } from './BracketView';

const VIEW_MARGIN = 12;

const closest = (ys: number[], from: number, to: number, y: number) => {
  let best = from;
  for (let j = from + 1; j < Math.min(to, ys.length); j++) {
    if (Math.abs((ys.at(j) ?? 0) - y) < Math.abs((ys.at(best) ?? 0) - y)) best = j;
  }
  return best;
};

const follow = (el: HTMLElement, bracket: Bracket, from: number, to: number) => {
  const body = snapPages(el).at(to)?.lastElementChild;
  if (!body) return;
  const top = headerOffset() + tabbarHeight(el);
  const bottom = window.innerHeight;
  const { top: y0, bottom: y1 } = body.getBoundingClientRect();
  const lo = Math.max(top, y0);
  const hi = Math.min(bottom, y1);
  if (hi <= lo) return;
  const src = bracket.columns.at(from)?.ys ?? [];
  const dst = bracket.columns.at(to)?.ys ?? [];
  const mid = (lo + hi) / 2 - y0;
  const a = closest(src, 0, src.length, mid);
  const d = to - from;
  const t = d > 0 ? a >> d : closest(dst, a << -d, (a + 1) << -d, mid);
  const y = y0 + (dst.at(t) ?? 0);
  const half = bracket.boxHeight / 2 + VIEW_MARGIN;
  if (y - half >= top && y + half <= bottom) return;
  const want = Math.min(Math.max(y0 + (src.at(a) ?? 0), top + half), bottom - half);
  window.scrollBy({ top: y - want, behavior: scrollBehavior() });
};

const reveal = (el: HTMLElement, bracket: Bracket, i: number) => {
  const body = snapPages(el).at(i)?.lastElementChild;
  const y = bracket.columns.at(i)?.ys.at(0);
  if (!body || y === undefined) return;
  const half = bracket.boxHeight / 2;
  const boxTop = body.getBoundingClientRect().top + y - half;
  if (boxTop + bracket.boxHeight + VIEW_MARGIN <= window.innerHeight) return;
  window.scrollBy({ top: boxTop - headerOffset() - tabbarHeight(el) - VIEW_MARGIN, behavior: scrollBehavior(true) });
};

export const MobileDraw: FC<{
  bracket: Bracket;
  round: number;
  onRound: (round: number) => void;
  onOpen: (id: string) => void;
}> = ({ bracket, round, onRound, onOpen }) => {
  const { columns } = bracket;
  const index = Math.min(round, columns.length - 1);
  const onMove = useCallback(
    (el: HTMLDivElement, from: number | null, to: number) => {
      if (from !== null) follow(el, bracket, from, to);
      else if (to > 0) reveal(el, bracket, to);
    },
    [bracket],
  );
  const { ref, shown, select } = useSnapPager<HTMLDivElement>(index, onRound, onMove);
  const options = useMemo(() => columns.map((c, i) => ({ value: String(i), label: c.short, tip: c.label })), [columns]);
  const onSelect = useCallback((v: string | null) => v !== null && select(Number(v)), [select]);

  return (
    <>
      <Segmented options={options} value={String(shown)} onChange={onSelect} />
      <BracketView ref={ref} bracket={bracket} onOpen={onOpen} snap />
    </>
  );
};
