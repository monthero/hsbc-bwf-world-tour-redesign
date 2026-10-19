import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useMemo } from 'react';

import { Partner } from '~/components/player';
import { Footnote } from '~/components/ui';
import { formatNumber } from '~/utils/format';

import { RESULTS_TIP } from '../constants';
import type { BreakdownItem, PendingResult, ResultGroup, TournamentRuns } from '../types';
import { medalCounts, pendingResults } from '../utils';
import { ResultText, SplitColumns, YearWeek } from './parts';

import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface BreakdownProps {
  group: ResultGroup;
  runs: readonly TournamentRuns[];
  showPartner: boolean;
  className?: string;
}

export const Breakdown = memo<BreakdownProps>(({ group, runs, showPartner, className }) => {
  const points = useMemo(() => group.items.reduce((s, t) => s + (t.counted ? t.points : 0), 0), [group]);
  const { gold, silver, bronze } = useMemo(() => medalCounts(group.items), [group]);
  const pending = useMemo(() => pendingResults(group, runs), [group, runs]);
  const { i18n } = useLingui();
  const total = formatNumber(points);
  return (
    <section className={className}>
      <header className={shared.head}>
        <h3 className={shared.label}>
          <Footnote note={i18n._(RESULTS_TIP)}>
            <Trans comment="Heading in the player Rankings tab: the tournament results whose points make up the current world ranking">
              Points breakdown
            </Trans>
          </Footnote>
        </h3>
        <span className={shared.sub}>
          <Trans comment="Ranking summary for one discipline: total points (pts), titles won, finals lost (runner-up), semi-finals lost (SF)">
            <b>{total}</b> pts · <Plural value={gold} one="# title" other="# titles" /> ·{' '}
            <Plural value={silver} other="# runner-up" /> · <Plural value={bronze} other="# SF" />
          </Trans>
        </span>
      </header>
      {showPartner && group.partner && <Partner player={group.partner} />}
      <SplitColumns>
        {pending.map((t) => (
          <PendingRow key={t.key} item={t} />
        ))}
        {group.items.map((t) => (
          <ResultRow key={t.key} item={t} />
        ))}
      </SplitColumns>
    </section>
  );
});

const PendingRow = memo<{ item: PendingResult }>(({ item: { name, year, result } }) => (
  <div className={shared.row}>
    <span className={shared.rowMain}>
      <span className={clsx(shared.rowTitle, utils.ellipsis, utils.bidiAuto)}>{name}</span>
      <span className={shared.rowMeta}>
        <Trans comment="Player Rankings tab, points breakdown: a finished tournament whose ranking points BWF hasn’t added yet. The world ranking is updated weekly">
          {year} · awaiting ranking update
        </Trans>
      </span>
    </span>
    <span className={shared.rowSide}>
      <ResultText result={result} />
      <b>–</b>
    </span>
  </div>
));

const ResultRow = memo<{ item: BreakdownItem }>(({ item: t }) => (
  <div className={shared.row} data-dim={!t.counted || undefined}>
    <span className={shared.rowMain}>
      <span className={clsx(shared.rowTitle, utils.ellipsis, utils.bidiAuto)}>{t.name}</span>
      <span className={shared.rowMeta}>
        <YearWeek year={t.year} week={t.week} counted={t.counted} />
      </span>
    </span>
    <span className={shared.rowSide}>
      <ResultText result={t.result} />
      <b>{formatNumber(t.points)}</b>
    </span>
  </div>
));
