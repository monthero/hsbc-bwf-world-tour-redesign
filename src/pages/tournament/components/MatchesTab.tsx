import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { useDeferredValue, useMemo, type FC } from 'react';

import { EmptyState } from '~/components/ui';
import { useMatchClock } from '~/hooks/useMatchClock';
import { useScrolledPast } from '~/hooks/useScrolledPast';
import { useMatchReplays } from '~/hooks/useTournamentMedia';
import { FOLLOW_KINDS, useFavoriteCount, useFavoritesMatcher } from '~/stores/favorites';
import type { Match, TournamentDay } from '~/types';

import { useOpenMatch } from '../hooks';
import type { TabProps } from '../types';
import { DayPicker } from './matches/DayPicker';
import { CondensedFilters, InlineFilters, MobileFilters } from './matches/FilterBars';
import { FinalsStack } from './matches/FinalsStack';
import { LiveSection } from './matches/LiveSection';
import { MatchGroups } from './matches/MatchGroups';
import { useMatchFilters } from './matches/useMatchFilters';
import { buildView, filterBase, followedBy, isFinalsDay, type MatchesView } from './matches/utils';

import page from '../TournamentPage.module.css';
import classes from './MatchesTab.module.css';
import utils from '~/styles/utils.module.css';

const NO_MATCHES: Match[] = [];

const byCourt = (a: Match, b: Match) => a.court - b.court;

const emptyMessage = (
  d: TournamentDay | undefined,
  future: boolean,
  view: MatchesView,
  following: boolean,
  followCount: number,
  finals: boolean,
) => {
  const day = d?.shortLabel ?? '';
  if (d?.isRest)
    return t({
      message: `${day} is a rest day with no matches.`,
      comment: 'Matches tab empty state. {day} is a short day label, e.g. "Wed 15"',
    });
  if (future && d && !d.matches.length)
    return t({
      message: `The order of play for ${day} is published the evening before.`,
      comment:
        'Matches tab empty state for a future day. The order of play is the daily match schedule. {day} is e.g. "Wed 15"',
    });
  if (finals ? view.ordered.length : view.upcoming.count || view.results.count) return '';
  if (view.liveIn && !finals)
    return t({
      message: 'Only live matches match these filters — see Live now above.',
      comment: 'Matches tab empty state. Live now is the title of the live matches section above',
    });
  if (following && !followCount)
    return t({
      message: 'Star a player, country or continent to follow them here.',
      comment: 'Matches tab empty state when the following filter is on but the visitor follows nobody',
    });
  return t({ message: 'No matches for these filters.', comment: 'Matches tab empty state' });
};

export const MatchesTab: FC<TabProps> = ({ tournament, schedule }) => {
  const { t: tr } = useLingui();
  const { days, todayIndex, focusIndex } = schedule;
  const f = useMatchFilters(days.length, focusIndex);
  const openMatch = useOpenMatch();
  const q = useDeferredValue(f.q);
  const matcher = useFavoritesMatcher();
  const followCount = useFavoriteCount(FOLLOW_KINDS);
  const [filtersRef, filtersOut] = useScrolledPast<HTMLDivElement>();
  const clock = useMatchClock();
  const replays = useMatchReplays(tournament);

  const dayData = days[f.day];
  const dayMatches = dayData?.matches ?? NO_MATCHES;

  const live = useMemo(
    () => (days[todayIndex]?.matches ?? NO_MATCHES).filter((m) => m.status === 'P').sort(byCourt),
    [days, todayIndex],
  );
  const followed = useMemo(() => followedBy(matcher), [matcher]);
  const sorting = useMemo(() => ({ sort: f.sort, following: f.following, followed }), [f.sort, f.following, followed]);
  const base = useMemo(() => filterBase(dayMatches, q, f.following, followed), [dayMatches, q, f.following, followed]);
  const view = useMemo(
    () => buildView(dayMatches, base, f.events, f.courts, sorting, clock),
    [dayMatches, base, f.events, f.courts, sorting, clock],
  );
  const finals = isFinalsDay(dayData);
  const finalsToday = finals && f.day === todayIndex;
  const strips = finals && view.ordered.length > 0;
  const empty = emptyMessage(dayData, f.day > todayIndex, view, f.following, followCount, finals);

  return (
    <div className={classes.root}>
      <CondensedFilters filters={f} view={view} days={days} visible={filtersOut} />
      {schedule.stale && tournament.status === 'live' && (
        <div className={clsx(utils.container, classes.live)}>
          <EmptyState variant="note">
            {tr({
              message: 'Live scores are unavailable right now. Showing results that may be up to an hour old.',
              comment: 'Note above the matches when the live score feed fails',
            })}
          </EmptyState>
        </div>
      )}
      {live.length > 0 && !finalsToday && (
        <div className={classes.live}>
          <LiveSection matches={live} tournament={tournament} onOpen={openMatch} />
        </div>
      )}
      <section className={clsx(utils.container, page.tabSection, classes.section)} data-strips={strips || undefined}>
        <DayPicker days={days} day={f.day} onChange={f.setDay} />
        <InlineFilters ref={filtersRef} filters={f} view={view} />
        {!finals && view.upcoming.count > 0 && (
          <MatchGroups
            title={tr({
              message: 'Up next',
              context: 'matches',
              comment: 'Matches tab section: matches not started yet',
            })}
            section={view.upcoming}
            next={view.next}
            onOpen={openMatch}
          />
        )}
        {!finals && view.results.count > 0 && (
          <MatchGroups
            title={tr({ message: 'Results', comment: 'Matches tab section: finished matches' })}
            section={view.results}
            next={view.next}
            replays={replays}
            onOpen={openMatch}
          />
        )}
        {empty && <EmptyState>{empty}</EmptyState>}
      </section>
      {strips && <FinalsStack matches={view.ordered} tournament={tournament} replays={replays} onOpen={openMatch} />}
      <MobileFilters filters={f} view={view} days={days} visible={filtersOut} />
    </div>
  );
};
