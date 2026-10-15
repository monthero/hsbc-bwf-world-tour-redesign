import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import { Segmented, type SegmentedOption, Tip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { formatNumber } from '~/utils/format';

import { RESULT_TAGS } from '../constants';
import type { BreakdownItem, HistoryView, ResultGroup } from '../types';
import { resultLabel, resultTier, shareVars } from '../utils';
import { ResultText, Section } from './parts';

import classes from './RankTrend.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

const groupLabel = (g: ResultGroup) => (g.partner ? `${g.ev} · ${g.partner.surname}` : g.ev);

export const RankTrend = memo<{ history: HistoryView | undefined; loading: boolean; onResults: () => void }>(
  ({ history, loading, onResults }) => {
    const groups = useMemo(() => history?.results.filter((g) => g.items.length > 1) ?? [], [history]);
    const [key, setKey] = useState<string | null>(null);
    const group = groups.find((g) => g.key === key) ?? groups[0];
    const options = useMemo(
      (): SegmentedOption<string>[] => groups.map((g) => ({ value: g.key, label: groupLabel(g) })),
      [groups],
    );
    const pick = useCallback((v: string | null) => v && setKey(v), []);
    if (loading)
      return (
        <div className={shared.section}>
          <Skeleton height={220} radius={12} />
        </div>
      );
    if (!group) return null;
    return (
      <Section
        label="Last 52 weeks"
        aside={
          <button type="button" className={shared.link} onClick={onResults}>
            All results
          </button>
        }
      >
        {options.length > 1 && <Segmented options={options} value={group.key} onChange={pick} height={30} />}
        <TrendBody group={group} />
      </Section>
    );
  },
);

const TrendBody = memo<{ group: ResultGroup }>(({ group }) => {
  const ordered = useMemo(() => group.items.toReversed(), [group.items]);
  const max = useMemo(() => Math.max(1, ...group.items.map((t) => t.points)), [group.items]);
  const points = useMemo(() => group.items.reduce((s, t) => s + (t.counted ? t.points : 0), 0), [group.items]);
  const [key, setKey] = useState<string | null>(null);
  const active = ordered.find((t) => t.key === key) ?? ordered.at(-1);
  return (
    <>
      <span className={classes.total}>
        <span className={shared.value}>{formatNumber(points)}</span>
        <span className={shared.sub}>Ranking points per event · {EVENT_NAMES[group.ev]}</span>
      </span>
      <div className={classes.bars}>
        {ordered.map((t) => (
          <TrendBar key={t.key} item={t} max={max} active={t === active} onPick={setKey} />
        ))}
      </div>
      {active && (
        <div className={shared.row}>
          <span className={shared.rowMain}>
            <span className={clsx(shared.rowTitle, utils.ellipsis)}>{active.name}</span>
            <span className={shared.rowMeta}>{active.yearWeek}</span>
          </span>
          <span className={shared.rowSide}>
            <ResultText result={active.result} />
            <b>{formatNumber(active.points)}</b>
          </span>
        </div>
      )}
    </>
  );
});

const TrendBar = memo<{ item: BreakdownItem; max: number; active: boolean; onPick: (key: string) => void }>(
  ({ item: t, max, active, onPick }) => {
    const pick = useCallback(() => onPick(t.key), [onPick, t.key]);
    const label = `${t.name} · ${resultLabel(t.result)} · ${formatNumber(t.points)}`;
    return (
      <Tip label={label}>
        <button
          type="button"
          className={classes.col}
          data-tier={resultTier(t.result)}
          data-dim={!t.counted || undefined}
          aria-pressed={active}
          aria-label={label}
          onClick={pick}
        >
          <span className={classes.tag}>{RESULT_TAGS[t.result]}</span>
          <span className={classes.fill} style={shareVars(t.points, max, 5)} />
        </button>
      </Tip>
    );
  },
);
