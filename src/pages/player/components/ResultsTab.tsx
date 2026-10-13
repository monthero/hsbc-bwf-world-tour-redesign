import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import { EventTag } from '~/components/match';
import { FactTile, Partner } from '~/components/player';
import { MedalCount } from '~/components/tournament';
import { EmptyState, IconButton, IconInfo, SectionTitle } from '~/components/ui';
import type { MedalKind } from '~/types';
import { formatNumber } from '~/utils/format';
import { medalOfResult } from '~/utils/medals';

import { MEDAL_TILES, RESULTS_TIP } from '../constants';
import type { HistoryView, MedalFilter, ResultGroup } from '../types';
import { medalCounts } from '../utils';
import { ResultPill } from './ResultPill';

import classes from './ResultsTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface ResultsTabProps {
  history: HistoryView | undefined;
  loading: boolean;
}

const INFO = (
  <IconButton label={RESULTS_TIP} tip={RESULTS_TIP} size="sm">
    <IconInfo size={16} />
  </IconButton>
);

const medalTitle = (label: string, count: number, active: boolean) => {
  if (!count) return undefined;
  return active ? 'Show all results' : `Highlight ${label.toLowerCase()}`;
};

export const ResultsTab = memo<ResultsTabProps>(({ history, loading }) => {
  const [filter, setFilter] = useState<MedalFilter>(null);
  const onFilter = useCallback((kind: MedalKind) => setFilter((f) => (f === kind ? null : kind)), []);
  const results = history?.results ?? [];
  const first = results[0];
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <SectionTitle aside={INFO}>Recent tournaments</SectionTitle>
      {loading && (
        <>
          <div className={shared.tiles}>
            {MEDAL_TILES.map((m) => (
              <Skeleton key={m.kind} height={60} radius={12} />
            ))}
            <Skeleton height={60} radius={12} />
          </div>
          <EmptyState variant="note">Loading ranking history…</EmptyState>
        </>
      )}
      {!loading && first && first.items.length > 0 && <Summary group={first} filter={filter} onFilter={onFilter} />}
      {!loading && !results.some((g) => g.items.length) && (
        <EmptyState variant="note">No ranking history on record.</EmptyState>
      )}
      {!loading && results.map((g) => <ResultGroupView key={g.key} group={g} filter={filter} />)}
    </div>
  );
});

const Summary = memo<{
  group: ResultGroup;
  filter: MedalFilter;
  onFilter: (kind: MedalKind) => void;
}>(({ group, filter, onFilter }) => {
  const points = useMemo(() => group.items.reduce((s, t) => s + (t.counted ? t.points : 0), 0), [group]);
  const counts = useMemo(() => medalCounts(group.items), [group]);
  return (
    <div className={shared.tiles}>
      <FactTile label="Ranking points" value={formatNumber(points)} tone="tile" />
      {MEDAL_TILES.map((m) => {
        const active = filter === m.kind;
        return (
          <MedalCount
            key={m.kind}
            kind={m.kind}
            label={m.label}
            count={counts[m.kind]}
            active={active}
            dimmed={!!filter && !active}
            title={medalTitle(m.label, counts[m.kind], active)}
            onClick={() => onFilter(m.kind)}
          />
        );
      })}
    </div>
  );
});

const ResultGroupView = memo<{ group: ResultGroup; filter: MedalFilter }>(({ group, filter }) => {
  const match = (n: number) => !filter || medalOfResult(n) === filter;
  const dimmed = !group.items.some((t) => match(t.result));
  return (
    <div className={classes.group}>
      <span className={classes.groupHead} data-dimmed={dimmed || undefined}>
        <EventTag event={group.ev} />
        {group.partner ? <Partner player={group.partner} /> : <span>Singles</span>}
      </span>
      {group.items.map((t) => (
        <div key={t.key} className={classes.row} data-dimmed={!match(t.result) || undefined}>
          <span className={classes.rowMain}>
            <span className={classes.rowName}>{t.name}</span>
            <span className={clsx(utils.num, classes.rowWeek)}>{t.yearWeek}</span>
          </span>
          <span className={classes.rowSide}>
            <ResultPill result={t.result} />
            <span className={clsx(utils.num, classes.rowPts)}>{formatNumber(t.points)}</span>
          </span>
        </div>
      ))}
    </div>
  );
});
