import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { Children, memo, type FC, type ReactNode } from 'react';

import { OutcomeLabel } from '~/components/match';
import { Tip } from '~/components/ui';
import { LEVEL_META, LEVEL_VARS } from '~/constants';
import type { Level, PlayerMatch } from '~/types';

import { resultLabel } from '../utils';

import shared from './shared.module.css';

export const Section: FC<{ label: ReactNode; aside?: ReactNode; className?: string; children: ReactNode }> = ({
  label,
  aside,
  className,
  children,
}) => (
  <section className={clsx(shared.section, className)}>
    <header className={shared.head}>
      <h2 className={shared.label}>{label}</h2>
      {aside}
    </header>
    {children}
  </section>
);

export const SplitColumns: FC<{ children: ReactNode }> = ({ children }) => {
  const items = Children.toArray(children);
  const half = Math.ceil(items.length / 2);
  return (
    <div className={shared.split}>
      <div className={shared.splitColumn}>{items.slice(0, half)}</div>
      {items.length > half && <div className={shared.splitColumn}>{items.slice(half)}</div>}
    </div>
  );
};

export const LevelDot = memo<{ level: Level }>(({ level }) => (
  <Tip label={LEVEL_META[level].label}>
    <span className={shared.dot} style={LEVEL_VARS[level]} />
  </Tip>
));

export const ResultText = memo<{ result: number | null }>(({ result }) => {
  const { i18n } = useLingui();
  return (
    <span className={shared.result} data-win={result === 1 || undefined}>
      {result ? resultLabel(i18n, result) : '—'}
    </span>
  );
});

export const YearWeek = memo<{ year: number; week: number; counted?: boolean }>(({ year, week, counted = true }) =>
  counted ? (
    <Trans comment="When a ranking result was earned: year and ranking week number (wk = week)">
      {year} · wk {week}
    </Trans>
  ) : (
    <Trans comment="When a ranking result was earned (wk = week); not counted means its points don’t count toward the ranking">
      {year} · wk {week} · not counted
    </Trans>
  ),
);

export const Outcome = memo<{ pm: PlayerMatch }>(({ pm }) => (
  <span className={shared.outcome} data-outcome={pm.outcome}>
    <OutcomeLabel pm={pm} />
  </span>
));
