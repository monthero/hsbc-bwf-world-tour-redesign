import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { LiveDot, SectionTitle, TabBar, type TabItem } from '~/components/ui';
import type { Game, Team } from '~/types';

import { CompareLine } from './CompareLine';
import { SideNames } from './SideNames';
import { shareOf, statView, type SplitRow } from './utils';

import classes from './MatchDetail.module.css';

const LIVE_BADGE = <LiveDot pulse size={6} />;

const MATCH_TAB = msg({
  message: 'Match',
  comment: 'Match stats tab: totals for the whole match, next to Game 1, Game 2…',
});

const gameTab = (i18n: I18n, game: number) =>
  i18n._(msg({ message: `Game ${game}`, comment: 'Match stats tab for one game of the match, e.g. Game 2' }));

const tabsFor = (i18n: I18n, count: number, live: number): TabItem<string>[] =>
  Array.from({ length: count + 1 }, (_, i) => ({
    value: String(i),
    label: i ? gameTab(i18n, i) : i18n._(MATCH_TAB),
    badge: i - 1 === live ? LIVE_BADGE : undefined,
  }));

const StatRow: FC<{ row: SplitRow }> = ({ row: r }) => {
  const { i18n } = useLingui();
  return (
    <CompareLine
      label={i18n._(r.label)}
      a={r.fa ?? r.a}
      b={r.fb ?? r.b}
      aBetter={r.a > r.b}
      bBetter={r.b > r.a}
      subA={r.sa}
      subB={r.sb}
      share={r.bar ? shareOf(r.a, r.b) : undefined}
    />
  );
};

export const StatsPanel = memo<{
  games: readonly Game[];
  teams: readonly [Team, Team];
  live: number;
  className?: string;
}>(({ games, teams, live, className }) => {
  const [tab, setTab] = useState(0);
  const active = Math.min(tab, games.length);
  const view = useMemo(() => statView(games, active), [games, active]);
  const { points } = view;
  const { t, i18n } = useLingui();
  const items = useMemo(() => tabsFor(i18n, games.length, live), [i18n, games.length, live]);
  const onTab = useCallback((v: string) => setTab(Number(v)), []);
  return (
    <section className={className}>
      <SectionTitle as="h3">
        <Trans>Match stats</Trans>
      </SectionTitle>
      <TabBar
        items={items}
        value={String(active)}
        onChange={onTab}
        ariaLabel={t`Match statistics`}
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
        {active - 1 === live ? (
          <Plural
            value={points}
            one="# point played so far"
            other="# points played so far"
            comment="Match stats footer for a game still in progress"
          />
        ) : (
          <Plural value={points} one="# point played" other="# points played" comment="Match stats footer" />
        )}
      </span>
    </section>
  );
});
