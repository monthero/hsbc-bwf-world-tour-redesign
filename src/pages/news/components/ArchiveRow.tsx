import { Skeleton } from '@mantine/core';
import { memo, useCallback, type CSSProperties, type FC } from 'react';

import { NewsCard, StorySkeleton, SubscribeCard } from '~/components/news';
import { RetryState } from '~/components/ui';

import type { ArchiveRow as Row, MonthGroup } from '../types';
import { storiesLabel } from '../utils';

import classes from './ArchiveRow.module.css';

const MonthHead: FC<{ group: MonthGroup; current: boolean }> = ({ group, current }) => {
  const { stories, failed } = group;
  return (
    <div className={classes.head}>
      <h2 className={classes.name}>
        {group.name} <span>{group.year}</span>
      </h2>
      {current && <span className={classes.badge}>This month</span>}
      <span className={classes.count}>
        {!stories && !failed && <Skeleton height={12} width={64} radius={6} />}
        {stories && storiesLabel(stories.length)}
      </span>
    </div>
  );
};

const MonthFailed: FC<{ group: MonthGroup; onRetry: (key: string) => void }> = ({ group, onRetry }) => {
  const retry = useCallback(() => onRetry(group.key), [onRetry, group.key]);
  return (
    <RetryState
      message={`Couldn’t load ${group.name} ${group.year}.`}
      onRetry={retry}
      compact
      className={classes.failed}
    />
  );
};

const Stories: FC<{ row: Extract<Row, { kind: 'stories' }>; compact: boolean }> = ({ row, compact }) => {
  const variant = compact ? 'compact' : 'card';
  return row.stories
    ? row.stories.map((s) => <NewsCard key={s.item.id} story={s} variant={variant} />)
    : Array.from({ length: row.size }, (_, i) => <StorySkeleton key={i} variant={variant} />);
};

export const ArchiveRow = memo<{
  row: Row;
  index: number;
  measure: (el: HTMLElement | null) => void;
  compact: boolean;
  columns: number;
  currentKey: string;
  onRetry: (key: string) => void;
}>(({ row, index, measure, compact, columns, currentKey, onRetry }) => {
  const stories = row.kind === 'stories';
  const style = stories && !compact ? ({ '--cols': columns } as CSSProperties) : undefined;
  return (
    <div
      ref={measure}
      data-index={index}
      data-kind={row.kind}
      data-variant={compact ? 'compact' : 'card'}
      data-first={(stories && row.first) || undefined}
      data-last={(stories && row.last) || undefined}
      aria-busy={(stories && !row.stories) || undefined}
      className={classes.row}
      style={style}
    >
      {row.kind === 'head' && <MonthHead group={row.group} current={row.group.key === currentKey} />}
      {row.kind === 'failed' && <MonthFailed group={row.group} onRetry={onRetry} />}
      {row.kind === 'subscribe' && <SubscribeCard compact />}
      {stories && <Stories row={row} compact={compact} />}
    </div>
  );
});
