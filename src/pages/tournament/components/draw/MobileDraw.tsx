import { useCallback, useMemo, useRef, type FC } from 'react';

import { Segmented } from '~/components/ui';
import { useSlideIn } from '~/hooks/useSlideIn';

import type { Bracket } from './bracket';
import { DrawBox } from './DrawBox';

import classes from './Draw.module.css';

const SLIDE_OPTS = { distance: (d: number) => 28 + Math.min(3, Math.abs(d)) * 12, duration: 300 };

export const MobileDraw: FC<{
  bracket: Bracket;
  round: number;
  onRound: (round: number) => void;
  onOpen: (id: string) => void;
}> = ({ bracket, round, onRound, onOpen }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { columns } = bracket;
  const index = Math.min(round, columns.length - 1);
  const col = columns[index];
  const options = useMemo(() => columns.map((c, i) => ({ value: String(i), label: c.short, tip: c.label })), [columns]);
  const select = useCallback((v: string | null) => v !== null && onRound(Number(v)), [onRound]);

  useSlideIn(ref, index, SLIDE_OPTS);

  return (
    <>
      <Segmented options={options} value={String(index)} onChange={select} />
      <div ref={ref} className={classes.mobile}>
        <div className={classes.mobileLabel}>{col && (col.day ? `${col.label} · ${col.day}` : col.label)}</div>
        <div className={classes.mobileList}>
          {col?.boxes.map((b) => (
            <DrawBox key={b.key} box={b} large onOpen={onOpen} />
          ))}
        </div>
      </div>
    </>
  );
};
