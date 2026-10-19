import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Collapse, Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo, useMemo, type FC, type ReactNode } from 'react';

import { EventTag } from '~/components/match';
import { Partner, PlayerAvatar, PlayerName, RaceQualifier, RankChange } from '~/components/player';
import { EmptyState, IconExpand, MoreButton } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { useFinalsCity } from '~/hooks/useTournaments';
import type { Player, PlayerMatch, RankView } from '~/types';
import { date, formatMonthYear } from '~/utils/dates';
import { formatNumber, formatRank, joinDots } from '~/utils/format';

import { PARTNER_LIMIT } from '../constants';
import type { DisciplineView, HistoryRow, HistoryView, ResultGroup, TournamentRuns } from '../types';
import { disciplineOf, tournamentRuns, yearRange } from '../utils';
import { Breakdown } from './Breakdown';
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

const OTHER_PARTNERS = (
  <Trans comment="Heading: the player’s other doubles partnerships in this discipline, besides the current one">
    Other partnerships
  </Trans>
);
const EARLIER_PARTNERS = (
  <Trans comment="Heading: the player’s earlier doubles partnerships in this discipline">Earlier partnerships</Trans>
);

const personKey = (p: Player | null | undefined) => (p ? p.id || p.name : '');

const yearOf = (iso: string) => date(iso).year();

const sinceLabel = (i18n: I18n, iso: string) => {
  const month = formatMonthYear(iso);
  return i18n._(msg({ message: `since ${month}`, comment: 'Start of a ranking spell; month is e.g. Mar 2019' }));
};

const statsOf = (i18n: I18n, d: DisciplineView): StatCell[] => {
  const list: StatCell[] = [];
  if (d.active && d.lead)
    list.push({
      key: 'points',
      label: i18n._(
        msg({ message: 'Points', context: 'ranking', comment: 'Ranking stat: current world ranking points' }),
      ),
      value: formatNumber(d.lead.points),
    });
  if (d.high) {
    const other = d.high.partner && personKey(d.high.partner) !== personKey(d.lead?.partner);
    const surname = d.high.partner?.surname ?? '';
    const rank = formatRank(d.high.rank);
    list.push({
      key: 'high',
      label: i18n._(
        msg({
          message: 'Career high',
          comment: 'Ranking stat: the best world ranking the player has ever reached in this discipline',
        }),
      ),
      value: rank,
      sub: joinDots([
        d.high.date && formatMonthYear(d.high.date),
        other &&
          i18n._(
            msg({
              message: `with ${surname}`,
              comment: 'Under the career-high ranking: the doubles partner at the time, by surname',
            }),
          ),
      ]),
    });
    if (d.high.weeks)
      list.push({
        key: 'weeks',
        label: i18n._(
          msg({
            message: `Weeks at ${rank}`,
            comment: 'Ranking stat: total weeks spent at the career-high world ranking; rank is e.g. #3',
          }),
        ),
        value: formatNumber(d.high.weeks),
      });
  }
  if (d.weeksRanked)
    list.push({
      key: 'ranked',
      label: i18n._(
        msg({
          message: 'Weeks ranked',
          comment:
            'Ranking stat: total number of weeks the player has appeared in the world ranking in this discipline',
        }),
      ),
      value: formatNumber(d.weeksRanked),
      sub: d.first ? sinceLabel(i18n, d.first) : undefined,
    });
  return list;
};

const periodOf = (i18n: I18n, r: HistoryRow) => {
  if (r.current) {
    const rank = formatRank(r.rank);
    return joinDots([
      r.first
        ? sinceLabel(i18n, r.first)
        : i18n._(msg({ message: 'current', comment: 'A partnership that is ranked right now' })),
      i18n._(msg({ message: `now ${rank}`, comment: 'The partnership’s world ranking right now; rank is e.g. #3' })),
    ]);
  }
  if (r.first && r.last) return yearRange(yearOf(r.first), yearOf(r.last));
  if (!r.last) return '';
  const month = formatMonthYear(r.last);
  return i18n._(msg({ message: `until ${month}`, comment: 'End of a ranking spell; month is e.g. Mar 2019' }));
};

interface RankingsTabProps {
  ranks: RankView[];
  history: HistoryView | undefined;
  loading: boolean;
  playerId: string;
  matches: readonly PlayerMatch[];
}

const NO_RESULTS: ResultGroup[] = [];

export const RankingsTab = memo<RankingsTabProps>(({ ranks, history, loading, playerId, matches }) => {
  const list = useMemo(() => (history?.groups ?? []).map(disciplineOf), [history]);
  const results = useMemo(
    () => Map.groupBy(history?.results.filter((g) => g.items.length > 0) ?? [], (g) => g.ev),
    [history],
  );
  const runs = useMemo(() => tournamentRuns(matches, playerId), [matches, playerId]);
  const active = useMemo(() => list.filter((d) => d.active), [list]);
  const past = useMemo(() => list.filter((d) => !d.active), [list]);
  if (loading) return <Skeleton height={360} radius={18} />;
  if (!list.length)
    return (
      <EmptyState>
        <Trans>No ranking history on record.</Trans>
      </EmptyState>
    );
  return (
    <div className={classes.tab}>
      {active.map((d) => (
        <DisciplineCard
          key={d.ev}
          view={d}
          rank={ranks.find((k) => k.ev === d.ev)}
          results={results.get(d.ev) ?? NO_RESULTS}
          runs={runs}
        />
      ))}
      {past.length > 0 && <PastList items={past} open={!active.length} />}
    </div>
  );
});

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

interface DisciplineCardProps {
  view: DisciplineView;
  rank: RankView | undefined;
  results: readonly ResultGroup[];
  runs: readonly TournamentRuns[];
}

const DisciplineCard = memo<DisciplineCardProps>(({ view: d, rank, results, runs }) => (
  <section className={clsx(utils.card, classes.card)}>
    <header className={classes.head}>
      <h2 className={classes.title}>
        <EventTag event={d.ev} tip={false} />
        {EVENT_NAMES[d.ev]}
      </h2>
      {d.lead?.partner && <Partner player={d.lead.partner} className={classes.partner} />}
    </header>
    <div className={classes.summary}>
      <div className={classes.now}>
        <span className={shared.label}>
          <Trans comment="Label above the player’s current BWF world ranking in this discipline">World rank</Trans>
        </span>
        <span className={classes.line}>
          <Figure value={d.lead?.rank} className={classes.big} />
          <RankChange value={rank?.change ?? 0} />
        </span>
      </div>
      <Stats view={d} />
      {rank?.race && <Race rank={rank} />}
    </div>
    <Body view={d}>
      {results.map((g) => (
        <Breakdown key={g.key} group={g} runs={runs} showPartner={results.length > 1} className={classes.breakdown} />
      ))}
    </Body>
  </section>
));

const Race = memo<{ rank: RankView }>(({ rank: k }) => {
  const city = useFinalsCity();
  if (!k.race) return null;
  const { rank, change, points } = k.race;
  const total = formatNumber(points);
  return (
    <div className={classes.race}>
      <span className={shared.label}>
        {city ? (
          <Trans comment="Race to Finals: the season standings that decide who qualifies for the World Tour Finals, held in this city">
            Race to {city}
          </Trans>
        ) : (
          <Trans comment="The season standings that decide who qualifies for the HSBC BWF World Tour Finals">
            Race to the Finals
          </Trans>
        )}
      </span>
      <span className={classes.line}>
        <Figure value={rank} className={classes.raceNum} />
        <RankChange value={change} />
        <RaceQualifier rank={k} />
      </span>
      <span className={shared.sub}>
        <Trans comment="Race to Finals points; pts = points">
          <b>{total}</b> pts
        </Trans>
      </span>
    </div>
  );
});

const Stats = memo<{ view: DisciplineView }>(({ view }) => {
  const { i18n } = useLingui();
  const cells = useMemo(() => statsOf(i18n, view), [i18n, view]);
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

const Body = memo<{ view: DisciplineView; children?: ReactNode }>(({ view: d, children }) => (
  <>
    {d.series.length > 1 && <RankChart points={d.series} live={d.active} />}
    {children}
    {d.partners.length > 0 && <Partners rows={d.partners} label={d.active ? OTHER_PARTNERS : EARLIER_PARTNERS} />}
  </>
));

const Partners = memo<{ rows: HistoryRow[]; label: ReactNode }>(({ rows, label }) => {
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

const PartnerItem = memo<{ row: HistoryRow }>(({ row: r }) => {
  const { i18n } = useLingui();
  return (
    <div className={classes.item} data-current={r.current || undefined}>
      {r.partner && <Partner player={r.partner} className={classes.who} />}
      <span className={classes.period}>{periodOf(i18n, r)}</span>
      <BestRank rank={r.best} />
    </div>
  );
});

const BestRank: FC<{ rank: number | undefined }> = ({ rank }) => {
  const best = formatRank(rank);
  return (
    <span className={classes.best}>
      <Trans comment="Best world ranking reached; rank is e.g. #3">
        best <b>{best}</b>
      </Trans>
    </span>
  );
};

const PastList = memo<{ items: DisciplineView[]; open: boolean }>(({ items, open }) => (
  <section className={clsx(utils.card, classes.past)}>
    <h2 className={clsx(shared.label, classes.pastLabel)}>
      <Trans comment="Heading: disciplines the player was ranked in before but is not any more">
        Previously ranked
      </Trans>
    </h2>
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
          <span className={classes.toggleTitle}>
            <EventTag event={d.ev} tip={false} />
            {EVENT_NAMES[d.ev]}
          </span>
          <span className={classes.toggleMeta}>
            {d.last && <LastRanked iso={d.last} />}
            {partner && <PastPartner player={partner} />}
          </span>
        </span>
        <BestRank rank={d.high?.rank} />
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

const LastRanked: FC<{ iso: string }> = ({ iso }) => {
  const month = formatMonthYear(iso);
  return (
    <span>
      <Trans comment="The last month the player appeared in this discipline’s world ranking; month is e.g. Mar 2019">
        Last ranked {month}
      </Trans>
    </span>
  );
};

const PastPartner: FC<{ player: Player }> = ({ player }) => (
  <span className={classes.pastPartner}>
    <PlayerAvatar player={player} size={18} />
    <PlayerName player={player} link={false} className={classes.pastName} />
  </span>
);
