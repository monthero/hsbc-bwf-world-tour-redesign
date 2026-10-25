import { clsx } from 'clsx';
import type { CSSProperties, FC, Ref } from 'react';

import { GAP, type Bracket } from './bracket';
import { DrawBox } from './DrawBox';

import classes from './Draw.module.css';

export const BracketView: FC<{
  bracket: Bracket;
  onOpen: (id: string) => void;
  snap?: boolean;
  ref?: Ref<HTMLDivElement>;
}> = ({ bracket, onOpen, snap, ref }) => {
  const { event, columns, height, boxHeight } = bracket;
  return (
    <div ref={ref} className={clsx(classes.scroller, snap && classes.snap)}>
      <div className={classes.grid} style={{ '--cols': columns.length } as CSSProperties}>
        {columns.map((col) => (
          <div key={col.id} className={classes.column}>
            <div className={classes.head} data-active={col.active || undefined}>
              <span className={classes.headDay}>{col.day}</span>
              <span className={classes.headLabel}>{col.label}</span>
            </div>
            <div className={classes.body} style={{ height }}>
              {col.paths.length > 0 && (
                <svg className={classes.svg} width={GAP} height={height} viewBox={`0 0 ${GAP} ${height}`}>
                  {col.paths.map((p) => (
                    <path key={p.key} d={p.d} data-win={p.win || undefined} />
                  ))}
                </svg>
              )}
              {col.boxes.map((b, j) => (
                <div
                  key={b.key}
                  className={classes.slot}
                  style={{ top: (col.ys[j] ?? 0) - boxHeight / 2, height: boxHeight }}
                >
                  <DrawBox box={b} event={event} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
