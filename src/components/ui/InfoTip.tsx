import { memo, type ReactNode } from 'react';

import classes from './InfoTip.module.css';

export interface InfoTipRow {
  label: string;
  value: ReactNode;
}

export const InfoTip = memo<{
  title: ReactNode;
  subtitle?: ReactNode;
  rows?: readonly InfoTipRow[];
  inline?: boolean;
}>(({ title, subtitle, rows = [], inline }) => (
  <div className={classes.tip}>
    <strong className={classes.title}>{title}</strong>
    {subtitle && <span className={classes.subtitle}>{subtitle}</span>}
    {rows.length > 0 && (
      <dl className={classes.rows} data-inline={inline || undefined}>
        {rows.map((r) => (
          <div key={r.label} className={classes.row}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    )}
  </div>
));
