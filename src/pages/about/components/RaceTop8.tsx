import { Skeleton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { Fragment, memo, useCallback, useMemo, useState, type FC } from 'react';

import { EventCode } from '~/api/schemas';
import { QualifyLine, QualifyMark, RankedNames } from '~/components/player';
import { IconNext, Segmented, SectionTitle } from '~/components/ui';
import { EVENT_NAMES, EVENT_OPTIONS, QUALIFY_SPOTS } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useRankingTable } from '~/hooks/useRankings';
import type { RankingTable, RankRow } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { formatNumber } from '~/utils/format';
import { buildRankRows } from '~/utils/rankings';

import { ABOUT_SECTIONS, RACE_LINE } from '../constants';
import { raceTop } from '../summaries';

import classes from './RaceTop8.module.css';
import more from './SectionLink.module.css';
import utils from '~/styles/utils.module.css';

interface RaceColumn {
  ev: EventCode;
  rows: RankRow[];
  cut: number;
}

const FALLBACK_TITLE = ABOUT_SECTIONS[1].title;

const toColumns = (table: RankingTable): RaceColumn[] =>
  EventCode.options.map((ev) => ({ ev, ...raceTop(buildRankRows(table.categories[ev] ?? [], true)) }));

const standingsSearch = (ev: EventCode) => ({ kind: 'race' as const, ev });

const RaceRow = memo<{ row: RankRow; out: boolean }>(({ row, out }) => (
  <li className={classes.row} data-out={out || undefined} data-qualify={row.qualify ?? undefined}>
    <span className={clsx(utils.num, classes.rank)}>{row.rank}</span>
    <RankedNames players={row.players} truncate className={classes.names} />
    {row.qualify === 'blocked' && <QualifyMark blocked />}
    <span className={clsx(utils.num, classes.points)}>{formatNumber(row.points)}</span>
  </li>
));

const RaceList: FC<{ column: RaceColumn }> = ({ column }) => (
  <ol className={classes.list}>
    {column.rows.map((r, i) => (
      <Fragment key={r.key}>
        <RaceRow row={r} out={i > column.cut} />
        {i === column.cut && (
          <li className={classes.line}>
            <QualifyLine label={RACE_LINE} className={classes.lineLabel} />
          </li>
        )}
      </Fragment>
    ))}
  </ol>
);

const DesktopColumn = memo<{ column: RaceColumn }>(({ column }) => (
  <div className={clsx(utils.card, classes.column)}>
    <Link to="/rankings" search={standingsSearch(column.ev)} className={classes.colHead}>
      {EVENT_NAMES[column.ev]}
      <span>{column.ev}</span>
    </Link>
    <RaceList column={column} />
  </div>
));

export const RaceTop8: FC<{ className?: string }> = ({ className }) => {
  const { data: table, isError } = useRankingTable('race');
  const isMobile = useIsMobile();
  const [ev, setEv] = useState<EventCode>('MS');
  const columns = useMemo(() => (table ? toColumns(table) : undefined), [table]);
  const onEv = useCallback((v: EventCode | null) => v && setEv(v), []);
  if (isError) return null;
  const title = table?.name ?? FALLBACK_TITLE;
  const current = columns?.find((c) => c.ev === ev);
  const caption = table && `Top ${QUALIFY_SPOTS} qualify · as of ${formatDayMonth(table.publication.date)}`;
  const aside = (
    <Link to="/rankings" search={standingsSearch(ev)} className={more.more}>
      Full standings
      <IconNext size={14} />
    </Link>
  );
  return (
    <section className={className} aria-label={title}>
      <SectionTitle count={isMobile ? undefined : caption} aside={aside}>
        {title}
      </SectionTitle>
      {isMobile && <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEv} />}
      {!columns && <Skeleton className={classes.skeleton} radius={16} />}
      {columns && !isMobile && (
        <div className={classes.grid}>
          {columns.map((c) => (
            <DesktopColumn key={c.ev} column={c} />
          ))}
        </div>
      )}
      {isMobile && current && (
        <div className={clsx(utils.card, classes.column)}>
          <RaceList column={current} />
        </div>
      )}
      {isMobile && caption && <p className={classes.caption}>{caption}</p>}
    </section>
  );
};
