import { clsx } from 'clsx';
import { memo, type FC, type ReactNode } from 'react';

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

export const LevelDot = memo<{ level: Level }>(({ level }) => (
  <Tip label={LEVEL_META[level].label}>
    <span className={shared.dot} style={LEVEL_VARS[level]} />
  </Tip>
));

export const ResultText = memo<{ result: number | null }>(({ result }) => (
  <span className={shared.result} data-win={result === 1 || undefined}>
    {result ? resultLabel(result) : '—'}
  </span>
));

export const Outcome = memo<{ pm: PlayerMatch }>(({ pm }) => (
  <span className={shared.outcome} data-outcome={pm.outcome}>
    <OutcomeLabel pm={pm} />
  </span>
));
