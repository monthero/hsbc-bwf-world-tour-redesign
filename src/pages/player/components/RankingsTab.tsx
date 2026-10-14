import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { Partner } from '~/components/player';
import { EmptyState } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { RankView } from '~/types';
import { formatNumber, formatRank, plural } from '~/utils/format';

import type { HistoryGroup, HistoryRow, HistoryView } from '../types';
import { Section } from './parts';

import classes from './RankingsTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

export const RankingsTab = memo<{ ranks: RankView[]; history: HistoryView | undefined; loading: boolean }>(
  ({ ranks, history, loading }) => {
    const groups = history?.groups ?? [];
    if (loading) return <Skeleton height={360} radius={18} />;
    if (!groups.length) return <EmptyState>No ranking history on record.</EmptyState>;
    return (
      <div className={clsx(utils.card, shared.panel)}>
        {groups.map((g) => (
          <EventSection key={g.ev} group={g} rank={ranks.find((k) => k.ev === g.ev)} />
        ))}
      </div>
    );
  },
);

const EventSection = memo<{ group: HistoryGroup; rank: RankView | undefined }>(({ group: g, rank }) => (
  <Section
    label={EVENT_NAMES[g.ev]}
    aside={
      rank?.race && (
        <span className={shared.sub}>
          Race to Finals · <b>{formatNumber(rank.race.points)}</b> pts
        </span>
      )
    }
  >
    <div className={shared.columns}>
      {g.rows.map((x) => (
        <HistoryItem key={x.key} row={x} />
      ))}
    </div>
  </Section>
));

const HistoryItem = memo<{ row: HistoryRow }>(({ row: x }) => (
  <div className={shared.row} data-lead>
    <span className={classes.mark} data-current={x.current || undefined} />
    <span className={shared.rowMain}>
      {x.partner ? <Partner player={x.partner} label={false} /> : <span className={shared.rowTitle}>Singles</span>}
      <span className={shared.rowMeta}>
        {x.current ? 'Current' : x.date && `Last ranked ${x.date}`}
        {x.weeks != null && ` · ${plural(x.weeks, 'week')} at best`}
      </span>
    </span>
    <span className={shared.rowSide}>
      <b>{formatRank(x.rank)}</b>
      <span>best {formatRank(x.best)}</span>
    </span>
  </div>
));
