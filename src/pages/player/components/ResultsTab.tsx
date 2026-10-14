import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo } from 'react';

import { Partner } from '~/components/player';
import { EmptyState, Footnote } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { formatNumber, plural } from '~/utils/format';

import { RESULTS_TIP } from '../constants';
import type { BreakdownItem, HistoryView, ResultGroup } from '../types';
import { medalCounts } from '../utils';
import { ResultText, Section } from './parts';

import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

export const ResultsTab = memo<{ history: HistoryView | undefined; loading: boolean }>(({ history, loading }) => {
  const results = useMemo(() => history?.results.filter((g) => g.items.length > 0) ?? [], [history]);
  if (loading) return <Skeleton height={420} radius={18} />;
  if (!results.length) return <EmptyState>No ranking history on record.</EmptyState>;
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
  const counts = useMemo(() => medalCounts(group.items), [group]);
  return (
    <Section
      label={
        <>
          {EVENT_NAMES[group.ev]}
          <Footnote note={RESULTS_TIP} />
        </>
      }
      aside={
        <span className={shared.sub}>
          <b>{formatNumber(points)}</b> pts · {plural(counts.gold, 'title')} · {counts.silver} runner-up ·{' '}
          {counts.bronze} SF
        </span>
      }
    >
      {group.partner && <Partner player={group.partner} />}
      <div className={shared.columns}>
        {group.items.map((t) => (
          <ResultRow key={t.key} item={t} />
        ))}
      </div>
    </Section>
  );
});

const ResultRow = memo<{ item: BreakdownItem }>(({ item: t }) => (
  <div className={shared.row} data-dim={!t.counted || undefined}>
    <span className={shared.rowMain}>
      <span className={clsx(shared.rowTitle, utils.ellipsis)}>{t.name}</span>
      <span className={shared.rowMeta}>
        {t.yearWeek}
        {!t.counted && ' · not counted'}
      </span>
    </span>
    <span className={shared.rowSide}>
      <ResultText result={t.result} />
      <b>{formatNumber(t.points)}</b>
    </span>
  </div>
));
