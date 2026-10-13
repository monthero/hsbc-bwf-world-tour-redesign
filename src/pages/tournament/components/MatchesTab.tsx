import { clsx } from 'clsx';
import { useDeferredValue, useMemo, type FC } from 'react';

import { EmptyState } from '~/components/ui';
import { useMatchClock } from '~/hooks/useMatchClock';
import { useScrolledPast } from '~/hooks/useScrolledPast';
import { FOLLOW_KINDS, useFavoriteCount, useFavoritesMatcher } from '~/stores/favorites';
import type { Match, TournamentDay } from '~/types';

import { useOpenMatch } from '../hooks';
import type { TabProps } from '../types';
import { DayPicker } from './matches/DayPicker';
import { CondensedFilters, InlineFilters, MobileFilters } from './matches/FilterBars';
import { LiveSection } from './matches/LiveSection';
import { MatchGroups } from './matches/MatchGroups';
import { useMatchFilters } from './matches/useMatchFilters';
import { buildView, filterBase, type MatchesView } from './matches/utils';

import page from '../TournamentPage.module.css';
import classes from './MatchesTab.module.css';
import utils from '~/styles/utils.module.css';

const NO_MATCHES: Match[] = [];

const STALE_NOTE = 'Live scores are unavailable right now. Showing results that may be up to an hour old.';

const byCourt = (a: Match, b: Match) => a.court - b.court;

const isSettled = (m: Match) => m.status === 'F';

const emptyMessage = (
  d: TournamentDay | undefined,
  future: boolean,
  view: MatchesView,
  following: boolean,
  followCount: number,
) => {
  if (d?.isRest) return `${d.shortLabel} is a rest day with no matches.`;
  if (future && d && !d.matches.length) return `The order of play for ${d.shortLabel} is published the evening before.`;
  if (view.upcoming.count || view.results.count) return '';
  if (view.liveIn) return 'Only live matches match these filters — see Live now above.';
  if (following && !followCount) return 'Star a player, country or continent to follow them here.';
  return 'No matches for these filters.';
};

export const MatchesTab: FC<TabProps> = ({ tournament, schedule }) => {
  const { days, todayIndex, focusIndex } = schedule;
  const f = useMatchFilters(days.length, focusIndex);
  const openMatch = useOpenMatch();
  const q = useDeferredValue(f.q);
  const matcher = useFavoritesMatcher();
  const followCount = useFavoriteCount(FOLLOW_KINDS);
  const [filtersRef, filtersOut] = useScrolledPast<HTMLDivElement>();
  const clock = useMatchClock();

  const dayData = days[f.day];
  const dayMatches = dayData?.matches ?? NO_MATCHES;

  const live = useMemo(
    () => (days[todayIndex]?.matches ?? NO_MATCHES).filter((m) => m.status === 'P').sort(byCourt),
    [days, todayIndex],
  );
  const base = useMemo(() => filterBase(dayMatches, q, f.following, matcher), [dayMatches, q, f.following, matcher]);
  const view = useMemo(
    () => buildView(dayMatches, base, f.events, f.courts, clock),
    [dayMatches, base, f.events, f.courts, clock],
  );
  const dayOver = useMemo(() => dayMatches.every(isSettled), [dayMatches]);
  const empty = emptyMessage(dayData, f.day > todayIndex, view, f.following, followCount);

  return (
    <div className={classes.root}>
      <CondensedFilters filters={f} view={view} days={days} visible={filtersOut} />
      {schedule.stale && tournament.status === 'live' && (
        <div className={clsx(utils.container, classes.live)}>
          <EmptyState variant="note">{STALE_NOTE}</EmptyState>
        </div>
      )}
      {live.length > 0 && (
        <div className={clsx(utils.container, classes.live)}>
          <LiveSection matches={live} tournament={tournament} onOpen={openMatch} />
        </div>
      )}
      <section className={clsx(utils.container, page.tabSection, classes.section)}>
        <DayPicker days={days} day={f.day} onChange={f.setDay} />
        <InlineFilters ref={filtersRef} filters={f} view={view} />
        {view.upcoming.count > 0 && (
          <MatchGroups
            title="Up next"
            storeKey="matches:up"
            defaultOpen
            section={view.upcoming}
            nextIds={view.nextIds}
            onOpen={openMatch}
          />
        )}
        {view.results.count > 0 && (
          <MatchGroups
            title="Results"
            storeKey={dayOver ? 'matches:results:done' : 'matches:results:live'}
            defaultOpen={dayOver}
            section={view.results}
            nextIds={view.nextIds}
            onOpen={openMatch}
          />
        )}
        {empty && <EmptyState>{empty}</EmptyState>}
      </section>
      <MobileFilters filters={f} view={view} days={days} visible={filtersOut} />
    </div>
  );
};
