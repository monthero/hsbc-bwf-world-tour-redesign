import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type FC } from 'react';

import { EmptyState, FilterChip, SearchField, Segmented, type SegmentedOption } from '~/components/ui';
import { EVENT_NAMES, EVENT_OPTIONS } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { usePlayerDirectory } from '~/hooks/usePlayers';
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

const VIEW_OPTIONS: readonly SegmentedOption<PlayersView>[] = [
  { value: 'country', label: 'By country' },
  { value: 'discipline', label: 'By discipline' },
];

const emptyNote = (q: string, filtered: boolean) =>
  q.trim() ? `No players match “${q}”${filtered ? ' with these filters.' : '.'}` : 'No entries match these filters.';

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
      {continents.length === 0 && <EmptyState>{emptyNote(q, top10 || !!ev)}</EmptyState>}
    </>
  );
};

const jumpTo = (event: EventCode) =>
  document.getElementById(disciplineId(event))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const JumpChip = memo<{ event: EventCode; count: number }>(({ event, count }) => {
  return (
    <FilterChip title={`Jump to ${EVENT_NAMES[event]}`} onClick={() => jumpTo(event)}>
      {event}
      <span className={classes.jumpCount}>{count}</span>
    </FilterChip>
  );
});

const ByDiscipline: FC<{ entries: Entry[]; q: string; top10: boolean }> = ({ entries, q, top10 }) => {
  const sections = useMemo(() => sectionEntries(entries, { q, top10 }), [entries, q, top10]);
  if (!sections.length) return <EmptyState>{emptyNote(q, top10)}</EmptyState>;
  return (
    <>
      {sections.length > 1 && (
        <nav className={classes.jump} aria-label="Disciplines">
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
  const update = useUpdateSearch();
  const { data: directory } = usePlayerDirectory();

  const latest = useMemo(() => latestEntries(schedule.matches, draw, entries), [schedule.matches, draw, entries]);
  const ranked = useMemo(() => rankEntries(latest, directory), [latest, directory]);

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
          <Segmented options={VIEW_OPTIONS} value={view} onChange={onView} className={classes.view} />
          {byCountry && (
            <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEvent} deselectable className={classes.seg} />
          )}
          <FilterChip
            active={top10}
            className={classes.top10}
            title="Only entries ranked in the world top 10 of their discipline"
            onClick={onTop10}
          >
            World top 10
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
