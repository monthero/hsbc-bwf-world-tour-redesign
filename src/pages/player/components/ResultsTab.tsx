import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo } from 'react';

import { Partner } from '~/components/player';
import { EmptyState, Footnote } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { formatNumber } from '~/utils/format';

import { RESULTS_TIP } from '../constants';
import type { BreakdownItem, HistoryView, ResultGroup } from '../types';
import { medalCounts } from '../utils';
import { ResultText, Section, SplitColumns, YearWeek } from './parts';

import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

export const ResultsTab = memo<{ history: HistoryView | undefined; loading: boolean }>(({ history, loading }) => {
  const results = useMemo(() => history?.results.filter((g) => g.items.length > 0) ?? [], [history]);
  if (loading) return <Skeleton height={420} radius={18} />;
  if (!results.length)
    return (
      <EmptyState>
        <Trans>No ranking history on record.</Trans>
      </EmptyState>
    );
  return (
    <div className={clsx(utils.card, shared.panel)}>
      {results.map((g) => (
        <ResultSection key={g.key} group={g} />
      ))}
    </div>
  );
});

const ResultSection = memo<{ group: ResultGroup }>(({ group }) => {
  const points = useMemo(() => group.items.reduce((s, t) => s + (t.counted ? t.points : 0), 0), [group]);
  const { gold, silver, bronze } = useMemo(() => medalCounts(group.items), [group]);
  const { i18n } = useLingui();
  const total = formatNumber(points);
  return (
    <Section
      label={<Footnote note={i18n._(RESULTS_TIP)}>{EVENT_NAMES[group.ev]}</Footnote>}
      aside={
        <span className={shared.sub}>
          <Trans comment="Ranking summary for one discipline: total points (pts), titles won, finals lost (runner-up), semi-finals lost (SF)">
            <b>{total}</b> pts · <Plural value={gold} one="# title" other="# titles" /> ·{' '}
            <Plural value={silver} other="# runner-up" /> · <Plural value={bronze} other="# SF" />
          </Trans>
        </span>
      }
    >
      {group.partner && <Partner player={group.partner} />}
      <SplitColumns>
        {group.items.map((t) => (
          <ResultRow key={t.key} item={t} />
        ))}
      </SplitColumns>
    </Section>
  );
});

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
