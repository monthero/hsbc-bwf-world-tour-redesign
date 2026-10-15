import { Collapse, Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo, useMemo, type FC } from 'react';

import { Partner, PlayerAvatar, PlayerName, RaceQualifier, RankChange } from '~/components/player';
import { EmptyState, IconExpand, MoreButton } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { useFinalsCity } from '~/hooks/useTournaments';
import type { Player, RankView } from '~/types';
import { date, formatMonthYear } from '~/utils/dates';
import { formatNumber, formatRank, joinDots } from '~/utils/format';

import { PARTNER_LIMIT } from '../constants';
import type { DisciplineView, HistoryRow, HistoryView } from '../types';
import { disciplineOf, yearRange } from '../utils';
import { RankChart } from './RankChart';

import classes from './RankingsTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface StatCell {
  key: string;
  label: string;
  value: string;
  sub?: string;
}

const personKey = (p: Player | null | undefined) => (p ? p.id || p.name : '');

const yearOf = (iso: string) => date(iso).year();

const statsOf = (d: DisciplineView): StatCell[] => {
  const list: StatCell[] = [];
  if (d.active && d.lead) list.push({ key: 'points', label: 'Points', value: formatNumber(d.lead.points) });
  if (d.high) {
    const other = d.high.partner && personKey(d.high.partner) !== personKey(d.lead?.partner);
    list.push({
      key: 'high',
      label: 'Career high',
      value: formatRank(d.high.rank),
      sub: joinDots([d.high.date && formatMonthYear(d.high.date), other && `with ${d.high.partner?.surname}`]),
    });
    if (d.high.weeks)
      list.push({ key: 'weeks', label: `Weeks at ${formatRank(d.high.rank)}`, value: formatNumber(d.high.weeks) });
  }
  if (d.weeksRanked)
    list.push({
      key: 'ranked',
      label: 'Weeks ranked',
      value: formatNumber(d.weeksRanked),
      sub: d.first ? `since ${formatMonthYear(d.first)}` : undefined,
    });
  return list;
};

const periodOf = (r: HistoryRow) => {
  if (r.current)
    return joinDots([r.first ? `since ${formatMonthYear(r.first)}` : 'current', `now ${formatRank(r.rank)}`]);
  if (r.first && r.last) return yearRange(yearOf(r.first), yearOf(r.last));
  return r.last ? `until ${formatMonthYear(r.last)}` : '';
};

export const RankingsTab = memo<{ ranks: RankView[]; history: HistoryView | undefined; loading: boolean }>(
  ({ ranks, history, loading }) => {
    const list = useMemo(() => (history?.groups ?? []).map(disciplineOf), [history]);
    const active = useMemo(() => list.filter((d) => d.active), [list]);
    const past = useMemo(() => list.filter((d) => !d.active), [list]);
    if (loading) return <Skeleton height={360} radius={18} />;
    if (!list.length) return <EmptyState>No ranking history on record.</EmptyState>;
    return (
      <div className={classes.tab}>
        {active.map((d) => (
          <DisciplineCard key={d.ev} view={d} rank={ranks.find((k) => k.ev === d.ev)} />
        ))}
        {past.length > 0 && <PastList items={past} open={!active.length} />}
      </div>
    );
  },
);

const Figure: FC<{ value: number | null | undefined; className?: string }> = ({ value, className }) => (
  <span className={clsx(utils.figure, className)}>
    {value ? (
      <>
        <span className={classes.hash}>#</span>
        {value}
      </>
    ) : (
      '—'
    )}
  </span>
);

const DisciplineCard = memo<{ view: DisciplineView; rank: RankView | undefined }>(({ view: d, rank }) => (
  <section className={clsx(utils.card, classes.card)}>
    <header className={classes.head}>
      <h2 className={classes.title}>{EVENT_NAMES[d.ev]}</h2>
      {d.lead?.partner && <Partner player={d.lead.partner} className={classes.partner} />}
    </header>
    <div className={classes.summary}>
      <div className={classes.now}>
        <span className={shared.label}>World rank</span>
        <span className={classes.line}>
          <Figure value={d.lead?.rank} className={classes.big} />
          <RankChange value={rank?.change ?? 0} />
        </span>
      </div>
      <Stats view={d} />
      {rank?.race && <Race rank={rank} />}
    </div>
    <Body view={d} />
  </section>
));

const Race = memo<{ rank: RankView }>(({ rank: k }) => {
  const city = useFinalsCity();
  if (!k.race) return null;
  const { rank, change, points } = k.race;
  return (
    <div className={classes.race}>
      <span className={shared.label}>{city ? `Race to ${city}` : 'Race to the Finals'}</span>
      <span className={classes.line}>
        <Figure value={rank} className={classes.raceNum} />
        <RankChange value={change} />
        <RaceQualifier rank={k} />
      </span>
      <span className={shared.sub}>
        <b>{formatNumber(points)}</b> pts
      </span>
    </div>
  );
});

const Stats = memo<{ view: DisciplineView }>(({ view }) => {
  const cells = useMemo(() => statsOf(view), [view]);
  if (!cells.length) return null;
  return (
    <dl className={classes.stats}>
      {cells.map((c) => (
        <div key={c.key} className={classes.stat}>
          <dt className={shared.label}>{c.label}</dt>
          <dd className={classes.statValue}>{c.value}</dd>
          {c.sub && <dd className={classes.statSub}>{c.sub}</dd>}
        </div>
      ))}
    </dl>
  );
});

const Body = memo<{ view: DisciplineView }>(({ view: d }) => (
  <>
    {d.series.length > 1 && <RankChart points={d.series} live={d.active} />}
    {d.partners.length > 0 && (
      <Partners rows={d.partners} label={d.active ? 'Other partnerships' : 'Earlier partnerships'} />
    )}
  </>
));

const Partners = memo<{ rows: HistoryRow[]; label: string }>(({ rows, label }) => {
  const [all, { toggle }] = useDisclosure(false);
  const shown = all ? rows : rows.slice(0, PARTNER_LIMIT);
  return (
    <div className={classes.partners}>
      <span className={shared.label}>{label}</span>
      <div className={classes.list}>
        {shown.map((r) => (
          <PartnerItem key={r.key} row={r} />
        ))}
      </div>
      {rows.length > PARTNER_LIMIT && (
        <MoreButton count={rows.length - PARTNER_LIMIT} expanded={all} onClick={toggle} className={classes.more} />
      )}
    </div>
  );
});

const PartnerItem = memo<{ row: HistoryRow }>(({ row: r }) => (
  <div className={classes.item} data-current={r.current || undefined}>
    {r.partner && <Partner player={r.partner} className={classes.who} />}
    <span className={classes.period}>{periodOf(r)}</span>
    <span className={classes.best}>
      best <b>{formatRank(r.best)}</b>
    </span>
  </div>
));

const PastList = memo<{ items: DisciplineView[]; open: boolean }>(({ items, open }) => (
  <section className={clsx(utils.card, classes.past)}>
    <h2 className={clsx(shared.label, classes.pastLabel)}>Previously ranked</h2>
    {items.map((d, i) => (
      <PastItem key={d.ev} view={d} initial={open && i === 0} />
    ))}
  </section>
));

const PastItem = memo<{ view: DisciplineView; initial: boolean }>(({ view: d, initial }) => {
  const [open, { toggle }] = useDisclosure(initial);
  const partner = d.lead?.partner;
  return (
    <div className={classes.pastItem}>
      <button type="button" className={classes.toggle} aria-expanded={open} onClick={toggle}>
        <span className={classes.toggleMain}>
          <span className={classes.toggleTitle}>{EVENT_NAMES[d.ev]}</span>
          <span className={classes.toggleMeta}>
            {d.last && <span>Last ranked {formatMonthYear(d.last)}</span>}
            {partner && <PastPartner player={partner} />}
          </span>
        </span>
        <span className={classes.best}>
          best <b>{formatRank(d.high?.rank)}</b>
        </span>
        <IconExpand size={16} className={classes.chevron} data-open={open || undefined} />
      </button>
      <Collapse expanded={open}>
        <div className={classes.pastBody}>
          <Stats view={d} />
          <Body view={d} />
        </div>
      </Collapse>
    </div>
  );
});

const PastPartner: FC<{ player: Player }> = ({ player }) => (
  <span className={classes.pastPartner}>
    <PlayerAvatar player={player} size={18} />
    <PlayerName player={player} link={false} className={classes.pastName} />
  </span>
);
