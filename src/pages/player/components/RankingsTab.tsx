import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { Partner, RaceQualifier } from '~/components/player';
import { EmptyState, SectionTitle } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { RankView } from '~/types';
import { formatNumber, formatRank, plural } from '~/utils/format';

import type { HistoryGroup, HistoryRow, HistoryView } from '../types';

import classes from './RankingsTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface RankingsTabProps {
  ranks: RankView[];
  history: HistoryView | undefined;
  loading: boolean;
}

export const RankingsTab = memo<RankingsTabProps>(({ ranks, history, loading }) => {
  const groups = history?.groups ?? [];
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <SectionTitle>Ranking history</SectionTitle>
      {loading && (
        <>
          <Skeleton height={58} radius={12} />
          <Skeleton height={58} radius={12} />
        </>
      )}
      {!loading && groups.map((g) => <HistoryGroupView key={g.ev} group={g} rank={ranks.find((k) => k.ev === g.ev)} />)}
      {!loading && !groups.length && <EmptyState variant="note">No ranking history on record.</EmptyState>}
    </div>
  );
});

const HistoryGroupView = memo<{ group: HistoryGroup; rank: RankView | undefined }>(({ group: g, rank }) => {
  return (
    <div className={classes.group}>
      <span className={classes.groupHead}>
        <span className={classes.groupName}>{EVENT_NAMES[g.ev]}</span>
        {rank?.race && (
          <span className={clsx(utils.num, classes.race)}>
            World Tour race · {formatNumber(rank.race.points)} pts
            <RaceQualifier rank={rank} />
          </span>
        )}
      </span>
      {g.rows.map((x) => (
        <HistoryItem key={x.key} row={x} />
      ))}
    </div>
  );
});

const HistoryItem = memo<{ row: HistoryRow }>(({ row: x }) => {
  return (
    <div className={classes.row} data-current={x.current || undefined}>
      <span className={classes.rowMain}>
        {x.partner && (
          <span className={classes.rowWho}>
            <Partner player={x.partner} />
          </span>
        )}
        <span className={classes.rowMeta}>
          {x.current && <span className={classes.currentTag}>Current ranking · </span>}
          {x.date && `Last ranked ${x.date}`}
          {x.weeks != null && ` · ${plural(x.weeks, 'week')} at best`}
        </span>
      </span>
      <span className={clsx(utils.num, classes.rowRank)}>
        <span className={classes.rank}>{formatRank(x.rank)}</span>
        <span className={classes.best}>
          best <b>{formatRank(x.best)}</b>
        </span>
      </span>
    </div>
  );
});
