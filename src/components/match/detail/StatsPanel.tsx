import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { liveGameStatsQuery, liveMatchStatsQuery } from '~/api/queries';
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
      aBetter={!r.neutral && r.a > r.b}
      bBetter={!r.neutral && r.b > r.a}
      subA={r.sa}
      subB={r.sb}
      share={r.bar ? shareOf(r.a, r.b) : undefined}
    />
  );
};

const SETTLED = { refetchInterval: false, staleTime: Infinity } as const;

const useTabStats = (tmtId: number, code: string, tab: number, live: number) => {
  const ready = !!tmtId && !!code;
  const poll = (tab ? tab - 1 === live : live >= 0) ? {} : SETTLED;
  const match = useQuery({ ...liveMatchStatsQuery(tmtId, code), ...poll, enabled: ready && !tab });
  const game = useQuery({ ...liveGameStatsQuery(tmtId, code, tab), ...poll, enabled: ready && tab > 0 });
  return (tab ? game.data : match.data?.sides) ?? null;
};

export const StatsPanel = memo<{
  games: readonly Game[];
  teams: readonly [Team, Team];
  live: number;
  tmtId: number;
  code: string;
  className?: string;
}>(({ games, teams, live, tmtId, code, className }) => {
  const [tab, setTab] = useState(0);
  const active = Math.min(tab, games.length);
  const stats = useTabStats(tmtId, code, active, live);
  const view = useMemo(() => statView(games, active, stats), [games, active, stats]);
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
    </section>
  );
});
