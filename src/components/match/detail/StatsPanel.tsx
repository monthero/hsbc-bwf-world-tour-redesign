import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { LiveDot, SectionTitle, TabBar, type TabItem } from '~/components/ui';
import type { Game, Team } from '~/types';
import { plural } from '~/utils/format';

import { CompareLine } from './CompareLine';
import { SideNames } from './SideNames';
import { shareOf, statView, type SplitRow } from './utils';

import classes from './MatchDetail.module.css';

const LIVE_BADGE = <LiveDot pulse size={6} />;

const tabsFor = (count: number, live: number): TabItem<string>[] =>
  Array.from({ length: count + 1 }, (_, i) => ({
    value: String(i),
    label: i ? `Game ${i}` : 'Match',
    badge: i - 1 === live ? LIVE_BADGE : undefined,
  }));

const StatRow: FC<{ row: SplitRow }> = ({ row: r }) => (
  <CompareLine
    label={r.label}
    a={r.fa ?? r.a}
    b={r.fb ?? r.b}
    aBetter={r.a > r.b}
    bBetter={r.b > r.a}
    subA={r.sa}
    subB={r.sb}
    share={r.bar ? shareOf(r.a, r.b) : undefined}
  />
);

export const StatsPanel = memo<{
  games: readonly Game[];
  teams: readonly [Team, Team];
  live: number;
  className?: string;
}>(({ games, teams, live, className }) => {
  const [tab, setTab] = useState(0);
  const active = Math.min(tab, games.length);
  const view = useMemo(() => statView(games, active), [games, active]);
  const items = useMemo(() => tabsFor(games.length, live), [games.length, live]);
  const onTab = useCallback((v: string) => setTab(Number(v)), []);
  return (
    <section className={className}>
      <SectionTitle as="h3">Match stats</SectionTitle>
      <TabBar
        items={items}
        value={String(active)}
        onChange={onTab}
        ariaLabel="Match statistics"
        size="sm"
        className={classes.statTabs}
      />
      <div className={classes.cmp}>
        <SideNames teams={teams} />
        {view.rows.map((r) => (
          <StatRow key={r.key} row={r} />
        ))}
      </div>
      <span className={classes.foot}>
        {plural(view.points, 'point')} played
        {active - 1 === live && ' so far'}
      </span>
    </section>
  );
});
