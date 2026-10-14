import { Skeleton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { Fragment, memo, useCallback, useMemo, useState, type FC } from 'react';

import { EventCode } from '~/api/schemas';
import { TeamPlayers } from '~/components/match';
import { AvatarGroup, QualifyLine, QualifyMark, RankedNames } from '~/components/player';
import { Segmented, SectionTitle } from '~/components/ui';
import { EVENT_NAMES, EVENT_OPTIONS, QUALIFY_SPOTS } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useRankingTable } from '~/hooks/useRankings';
import type { Champion, RankingTable, RankRow, Tournament } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { formatNumber } from '~/utils/format';
import { buildRankRows } from '~/utils/rankings';
import { finalsCity, tournamentParams } from '~/utils/tournaments';

import { ABOUT_SECTIONS, FINALS_CHAMPIONS, FINALS_RESULTS, QUALIFIED_FOR, RACE_LINE } from '../constants';
import { raceTop } from '../summaries';
import type { SeasonFocus } from '../types';
import { crownedFinals, raceSettled } from '../utils';
import { SectionLink } from './SectionLink';

import classes from './RaceTop8.module.css';
import utils from '~/styles/utils.module.css';

interface RaceColumn {
  ev: EventCode;
  rows: RankRow[];
  cut: number;
}

const FALLBACK_TITLE = ABOUT_SECTIONS[1].title;

const SKELETON = <Skeleton className={classes.skeleton} radius={16} />;

const PODIUM_SEARCH = { tab: 'podium' as const };

const isQualified = (r: RankRow) => r.qualify === 'qualified';

const toColumn = (table: RankingTable, ev: EventCode, settled: boolean): RaceColumn => {
  const rows = buildRankRows(table.categories[ev] ?? [], true);
  if (!settled) return { ev, ...raceTop(rows) };
  const qualified = rows.filter(isQualified);
  return { ev, rows: qualified, cut: qualified.length };
};

const toColumns = (table: RankingTable, settled: boolean): RaceColumn[] =>
  EventCode.options.map((ev) => toColumn(table, ev, settled));

const standingsSearch = (ev: EventCode) => ({ kind: 'race' as const, ev });

const RaceRow = memo<{ row: RankRow; out: boolean; settled: boolean }>(({ row, out, settled }) => (
  <li className={classes.row} data-out={out || undefined} data-qualify={row.qualify ?? undefined}>
    <span className={clsx(utils.num, classes.rank)}>{row.rank}</span>
    <RankedNames players={row.players} truncate className={classes.names} />
    <QualifyMark qualified={settled && isQualified(row)} blocked={row.qualify === 'blocked'} />
    <span className={clsx(utils.num, classes.points)}>{formatNumber(row.points)}</span>
  </li>
));

const RaceList: FC<{ column: RaceColumn; settled: boolean }> = ({ column, settled }) => (
  <ol className={classes.list}>
    {column.rows.map((r, i) => (
      <Fragment key={r.key}>
        <RaceRow row={r} out={i > column.cut} settled={settled} />
        {i === column.cut && (
          <li className={classes.line}>
            <QualifyLine label={RACE_LINE} className={classes.lineLabel} />
          </li>
        )}
      </Fragment>
    ))}
  </ol>
);

const DesktopColumn = memo<{ column: RaceColumn; settled: boolean }>(({ column, settled }) => (
  <div className={clsx(utils.card, classes.column)}>
    <Link to="/rankings" search={standingsSearch(column.ev)} className={classes.colHead}>
      {EVENT_NAMES[column.ev]}
      <span>{column.ev}</span>
    </Link>
    <RaceList column={column} settled={settled} />
  </div>
));

const ChampionCard = memo<{ champion: Champion }>(({ champion: c }) => (
  <li className={clsx(utils.card, classes.champion)}>
    <span className={classes.colHead}>
      {EVENT_NAMES[c.event]}
      <span>{c.event}</span>
    </span>
    <AvatarGroup players={c.players} size={52} crop={156} className={classes.avatars} />
    <TeamPlayers players={c.players} truncate className={classes.names} />
  </li>
));

const FinalsChampions: FC<{ finals: Tournament; className?: string }> = ({ finals: t, className }) => {
  const isMobile = useIsMobile();
  const caption = `${t.heading} · ${t.place}`;
  const aside = (
    <SectionLink link={{ to: '/world-tour/$year/$slug', params: tournamentParams(t), search: PODIUM_SEARCH }}>
      {FINALS_RESULTS}
    </SectionLink>
  );
  return (
    <section className={className} aria-label={FINALS_CHAMPIONS}>
      <SectionTitle count={isMobile ? undefined : caption} aside={aside}>
        {FINALS_CHAMPIONS}
      </SectionTitle>
      <ol className={classes.champions}>
        {t.champions.map((c) => (
          <ChampionCard key={c.event} champion={c} />
        ))}
      </ol>
      {isMobile && <p className={classes.caption}>{caption}</p>}
    </section>
  );
};

const RaceStandings: FC<{ focus: SeasonFocus | undefined; className?: string }> = ({ focus, className }) => {
  const { data: table, isError } = useRankingTable('race');
  const isMobile = useIsMobile();
  const [ev, setEv] = useState<EventCode>('MS');
  const published = table?.publication.date;
  const settled = !!focus && !!published && raceSettled(focus, published);
  const columns = useMemo(() => (table ? toColumns(table, settled) : undefined), [table, settled]);
  const onEv = useCallback((v: EventCode | null) => v && setEv(v), []);
  if (isError) return null;
  const title = settled ? `${QUALIFIED_FOR} ${finalsCity(focus?.finals)}` : (table?.name ?? FALLBACK_TITLE);
  const current = columns?.find((c) => c.ev === ev);
  const caption =
    published &&
    (settled
      ? `Final standings · ${formatDayMonth(published)}`
      : `Top ${QUALIFY_SPOTS} qualify · as of ${formatDayMonth(published)}`);
  const ready = columns && focus;
  const aside = <SectionLink link={{ to: '/rankings', search: standingsSearch(ev) }}>Full standings</SectionLink>;
  return (
    <section className={className} aria-label={title}>
      <SectionTitle count={isMobile ? undefined : caption} aside={aside}>
        {title}
      </SectionTitle>
      {isMobile && <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEv} />}
      {!ready && SKELETON}
      {ready && !isMobile && (
        <div className={classes.grid}>
          {columns.map((c) => (
            <DesktopColumn key={c.ev} column={c} settled={settled} />
          ))}
        </div>
      )}
      {ready && isMobile && current && (
        <div className={clsx(utils.card, classes.column)}>
          <RaceList column={current} settled={settled} />
        </div>
      )}
      {isMobile && caption && <p className={classes.caption}>{caption}</p>}
    </section>
  );
};

export const RaceTop8: FC<{ focus: SeasonFocus | undefined; className?: string }> = ({ focus, className }) => {
  const crowned = focus && crownedFinals(focus);
  return crowned ? (
    <FinalsChampions finals={crowned} className={className} />
  ) : (
    <RaceStandings focus={focus} className={className} />
  );
};
