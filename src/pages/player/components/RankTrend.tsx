import { Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import { Segmented, type SegmentedOption, Tip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { formatNumber } from '~/utils/format';

import { RESULT_TAGS } from '../constants';
import type { BreakdownItem, HistoryView, ResultGroup } from '../types';
import { resultLabel, resultTier, shareVars } from '../utils';
import { ResultText, Section, YearWeek } from './parts';

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
      (): SegmentedOption<string>[] => groups.map((g) => ({ value: g.key, label: groupLabel(g), event: g.ev })),
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
        label={<Trans comment="Section title: ranking points earned over the last 52 weeks">Last 52 weeks</Trans>}
        aside={
          <button type="button" className={shared.link} onClick={onResults}>
            <Trans comment="Link to the points breakdown in the player’s Rankings tab">All results</Trans>
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
  const discipline = EVENT_NAMES[group.ev];
  return (
    <>
      <span className={classes.total}>
        <span className={shared.value}>{formatNumber(points)}</span>
        <span className={shared.sub}>
          <Trans comment="Caption under the ranking points total; each bar is one tournament (event); discipline is e.g. Men’s singles">
            Ranking points per event · {discipline}
          </Trans>
        </span>
      </span>
      <div className={classes.bars} dir="ltr">
        {ordered.map((t) => (
          <TrendBar key={t.key} item={t} max={max} active={t === active} onPick={setKey} />
        ))}
      </div>
      {active && (
        <div className={shared.row}>
          <span className={shared.rowMain}>
            <span className={clsx(shared.rowTitle, utils.ellipsis, utils.bidiAuto)}>{active.name}</span>
            <span className={shared.rowMeta}>
              <YearWeek year={active.year} week={active.week} />
            </span>
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
    const { i18n } = useLingui();
    const pick = useCallback(() => onPick(t.key), [onPick, t.key]);
    const label = `${t.name} · ${resultLabel(i18n, t.result)} · ${formatNumber(t.points)}`;
    const tag = RESULT_TAGS[t.result];
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
          <span className={classes.tag}>{tag && i18n._(tag)}</span>
          <span className={classes.fill} style={shareVars(t.points, max, 5)} />
        </button>
      </Tip>
    );
  },
);
