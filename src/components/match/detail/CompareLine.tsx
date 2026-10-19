import { clsx } from 'clsx';
import { memo, type CSSProperties, type ReactNode } from 'react';

import classes from './MatchDetail.module.css';
import utils from '~/styles/utils.module.css';

export const CompareLine = memo<{
  label: string;
  a: ReactNode;
  b: ReactNode;
  aBetter?: boolean;
  bBetter?: boolean;
  subA?: string;
  subB?: string;
  share?: number;
  size?: 'sm';
}>(({ label, a, b, aBetter, bBetter, subA, subB, share, size }) => (
  <div className={classes.cmpRow} data-size={size}>
    <div className={classes.cmpLine}>
      <span className={clsx(utils.num, classes.cmpValue)} data-better={aBetter || undefined}>
        {a}
        {subA && <span className={classes.cmpSub}>{subA}</span>}
      </span>
      <span className={classes.cmpLabel}>{label}</span>
      <span className={clsx(utils.num, classes.cmpValue)} data-side="b" data-better={bBetter || undefined}>
        {subB && <span className={classes.cmpSub}>{subB}</span>}
        {b}
      </span>
    </div>
    {share !== undefined && (
      <div className={classes.split}>
        <span
          className={classes.splitA}
          data-lead={!bBetter || undefined}
          style={{ '--w': `${Math.round(share)}%` } as CSSProperties}
        />
        <span className={classes.splitB} data-lead={!aBetter || undefined} />
      </div>
    )}
  </div>
));
