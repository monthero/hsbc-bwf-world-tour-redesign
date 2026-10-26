import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, use, useCallback, useMemo, type FC } from 'react';

import { EmptyState, FilterChip, IconCheck, SearchField, Segmented } from '~/components/ui';
import { EVENT_NAMES, EVENT_OPTIONS } from '~/constants';
import { TournamentRankContext } from '~/contexts';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useLazyOptions, type LazyOption } from '~/i18n/useLazyOptions';
import type { EventCode } from '~/types';

import { useOpenMatch, useUpdateSearch } from '../hooks';
import type { PlayersView, TabProps } from '../types';
import { ContinentSection } from './players/ContinentSection';
import { DisciplineSection } from './players/DisciplineSection';
import { disciplineId, groupEntries, latestEntries, rankEntries, sectionEntries, type Entry } from './players/entries';

import page from '../TournamentPage.module.css';
import classes from './players/Players.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/world-tour/$year/$slug');

const VIEW_OPTIONS: readonly LazyOption<PlayersView>[] = [
  {
    value: 'country',
    label: msg({ message: 'By country', comment: 'Players tab view switch: group entries by country and continent' }),
  },
  {
    value: 'discipline',
    label: msg({
      message: 'By discipline',
      comment: 'Players tab view switch: group entries by event (MS, WS, MD, WD, XD)',
    }),
  },
];

const EmptyNote: FC<{ q: string; filtered: boolean }> = ({ q, filtered }) => {
  if (!q.trim())
    return (
      <EmptyState>
        <Trans comment="Players tab: no entries pass the chosen filters">No entries match these filters.</Trans>
      </EmptyState>
    );
  return (
    <EmptyState>
      {filtered ? (
        <Trans comment="Players tab: the search {q} finds nobody with the chosen filters">
          No players match “{q}” with these filters.
        </Trans>
      ) : (
        <Trans comment="Players tab: the search {q} finds nobody">No players match “{q}”.</Trans>
      )}
    </EmptyState>
  );
};

const ByCountry: FC<{ entries: Entry[]; q: string; top10: boolean }> = ({ entries, q, top10 }) => {
  const ev = route.useSearch({ select: (s) => s.pev });
  const onOpen = useOpenMatch();
  const mobile = useIsMobile();
  const continents = useMemo(() => groupEntries(entries, { ev, q, top10 }), [entries, ev, q, top10]);
  const searching = q.trim() !== '';
  return (
    <>
      {continents.map((c) => (
        <ContinentSection key={c.name} continent={c} accordion={mobile} forceOpen={searching} onOpen={onOpen} />
      ))}
      {continents.length === 0 && <EmptyNote q={q} filtered={top10 || !!ev} />}
    </>
  );
};

const jumpTo = (event: EventCode) =>
  document.getElementById(disciplineId(event))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const JumpChip = memo<{ event: EventCode; count: number }>(({ event, count }) => {
  const { t } = useLingui();
  const name = EVENT_NAMES[event];
  return (
    <FilterChip
      tip={t({
        message: `Jump to ${name}`,
        comment: 'Tooltip on a chip that scrolls to an event’s entries, e.g. “Jump to Men’s singles”',
      })}
      onClick={() => jumpTo(event)}
    >
      {event}
      <span className={classes.jumpCount}>{count}</span>
    </FilterChip>
  );
});

const ByDiscipline: FC<{ entries: Entry[]; q: string; top10: boolean }> = ({ entries, q, top10 }) => {
  const { t } = useLingui();
  const sections = useMemo(() => sectionEntries(entries, { q, top10 }), [entries, q, top10]);
  if (!sections.length) return <EmptyNote q={q} filtered={top10} />;
  return (
    <>
      {sections.length > 1 && (
        <nav
          className={classes.jump}
          aria-label={t({
            message: 'Disciplines',
            comment: 'Accessible name of the chips that jump to each event’s entries',
          })}
        >
          {sections.map((s) => (
            <JumpChip key={s.event} event={s.event} count={s.count} />
          ))}
        </nav>
      )}
      <div className={classes.disciplines}>
        {sections.map((s) => (
          <DisciplineSection key={s.event} section={s} />
        ))}
      </div>
    </>
  );
};

export const PlayersTab: FC<TabProps> = ({ schedule, draw, entries }) => {
  const view = route.useSearch({ select: (s) => s.pby ?? 'country' });
  const ev = route.useSearch({ select: (s) => s.pev });
  const top10 = route.useSearch({ select: (s) => s.top10 ?? false });
  const q = route.useSearch({ select: (s) => s.q ?? '' });
  const { t } = useLingui();
  const update = useUpdateSearch();
  const rankOf = use(TournamentRankContext);
  const viewOptions = useLazyOptions(VIEW_OPTIONS);

  const latest = useMemo(() => latestEntries(schedule.matches, draw, entries), [schedule.matches, draw, entries]);
  const ranked = useMemo(() => rankEntries(latest, rankOf), [latest, rankOf]);

  const onView = useCallback(
    (v: PlayersView | null) => v && update({ pby: v === 'country' ? undefined : v }),
    [update],
  );
  const onEvent = useCallback((v: EventCode | null) => update({ pev: v ?? undefined }), [update]);
  const onTop10 = useCallback(() => update((s) => ({ top10: s.top10 ? undefined : true })), [update]);
  const onQuery = useCallback((v: string) => update({ q: v || undefined }), [update]);

  const byCountry = view === 'country';

  return (
    <section className={clsx(utils.container, page.tabSection, classes.section)}>
      <div className={classes.toolbar}>
        <div className={classes.filters}>
          <Segmented options={viewOptions} value={view} onChange={onView} className={classes.view} />
          {byCountry && (
            <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEvent} deselectable className={classes.seg} />
          )}
          <FilterChip
            active={top10}
            className={classes.top10}
            tip={t({
              message: 'Only entries ranked in the world top 10 of their discipline',
              comment: 'Tooltip on the World top 10 filter chip in the Players tab',
            })}
            onClick={onTop10}
          >
            <Trans comment="Players tab filter chip: show only entries in the world ranking top 10">World top 10</Trans>
            <span className={classes.check} data-on={top10 || undefined} aria-hidden>
              {top10 && <IconCheck />}
            </span>
          </FilterChip>
        </div>
        <SearchField value={q} onChange={onQuery} size="md" className={classes.search} />
      </div>
      {byCountry ? (
        <ByCountry entries={ranked} q={q} top10={top10} />
      ) : (
        <ByDiscipline entries={ranked} q={q} top10={top10} />
      )}
    </section>
  );
};
