import { useDebouncedCallback } from '@mantine/hooks';
import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type FC } from 'react';

import { EmptyState } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useRankingTable } from '~/hooks/useRankings';
import type { EventCode, RankingKind, RankingTable, RankRow } from '~/types';
import { countryOptions, searchTokens } from '~/utils/filter';
import { isDoubles } from '~/utils/matches';
import { RANKINGS_PAGE_META } from '~/utils/meta';
import { STAY } from '~/utils/navigation';
import { buildRankRows } from '~/utils/rankings';

import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { Podium } from './components/Podium';
import { RankingList } from './components/RankingList';
import { DEFAULT_KIND, SEARCH_DEBOUNCE_MS } from './constants';
import { filterRows } from './utils';

import classes from './RankingsPage.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/rankings');

const DEFAULT_EV: EventCode = 'MS';

const DEBOUNCE = { delay: SEARCH_DEBOUNCE_MS, flushOnUnmount: true };

const countriesOf = (r: RankRow) => r.countries;

export const RankingsPage: FC = () => {
  const { kind = DEFAULT_KIND, ev = DEFAULT_EV } = route.useSearch();
  const navigate = route.useNavigate();
  const { data: table } = useRankingTable(kind);
  useDocumentMeta(RANKINGS_PAGE_META[kind]);

  const onKind = useCallback(
    (v: RankingKind | null) =>
      v && void navigate({ search: (s) => ({ ...s, kind: v === DEFAULT_KIND ? undefined : v }), ...STAY }),
    [navigate],
  );
  const onEv = useCallback(
    (v: EventCode | null) =>
      v && void navigate({ search: (s) => ({ ...s, ev: v === DEFAULT_EV ? undefined : v }), ...STAY }),
    [navigate],
  );

  return (
    <div className={classes.page}>
      <Header table={table} kind={kind} ev={ev} onKind={onKind} onEv={onEv} />
      {table && <Category key={`${kind}-${ev}`} table={table} ev={ev} />}
    </div>
  );
};

const Category: FC<{ table: RankingTable; ev: EventCode }> = ({ table, ev }) => {
  const isMobile = useIsMobile();
  const { q = '', cc } = route.useSearch();
  const navigate = route.useNavigate();
  const [query, setQuery] = useState(q);
  const pushed = useRef(q);
  const deferred = useDeferredValue(query);
  const race = table.kind === 'race';
  const doubles = isDoubles(ev);

  const rows = useMemo(() => buildRankRows(table.categories[ev] ?? [], race), [table, ev, race]);
  const countries = useMemo(() => countryOptions(rows, countriesOf), [rows]);
  const played = useMemo(() => rows.some((r) => r.tournaments !== null), [rows]);
  const tokens = useMemo(() => searchTokens(deferred), [deferred]);
  const filtered = useMemo(() => filterRows(rows, tokens, cc), [rows, tokens, cc]);
  const narrowed = filtered !== rows;

  const pushQuery = useDebouncedCallback((v: string) => {
    pushed.current = v.trim();
    void navigate({ search: (s) => ({ ...s, q: pushed.current || undefined }), ...STAY });
  }, DEBOUNCE);

  useEffect(() => {
    if (q === pushed.current) return;
    pushed.current = q;
    setQuery(q);
  }, [q]);

  const onQuery = useCallback(
    (v: string) => {
      setQuery(v);
      pushQuery(v);
    },
    [pushQuery],
  );
  const onCountry = useCallback(
    (v: string | undefined) => void navigate({ search: (s) => ({ ...s, cc: v }), ...STAY }),
    [navigate],
  );
  const onClear = useCallback(() => {
    setQuery('');
    pushQuery.cancel();
    pushed.current = '';
    void navigate({ search: (s) => ({ ...s, q: undefined, cc: undefined }), ...STAY });
  }, [navigate, pushQuery]);

  if (!rows.length)
    return (
      <div className={clsx(utils.container, classes.main)}>
        <EmptyState>No {EVENT_NAMES[ev].toLowerCase()} ranking published yet</EmptyState>
      </div>
    );

  return (
    <>
      <Podium rows={rows} />
      <FilterBar
        query={query}
        onQuery={onQuery}
        cc={cc}
        onCountry={onCountry}
        countries={countries}
        shown={filtered.length}
        total={rows.length}
        doubles={doubles}
      />
      <main className={clsx(utils.container, classes.main)}>
        {filtered.length ? (
          <RankingList
            key={`${cc ?? ''}|${tokens.join(' ')}`}
            rows={filtered}
            caption={`${table.name} · ${EVENT_NAMES[ev]}`}
            doubles={doubles}
            avatars={!isMobile}
            played={played}
            showCutoff={race && !narrowed}
          />
        ) : (
          <EmptyState>
            No {doubles ? 'pairs' : 'players'} match these filters.{' '}
            <button type="button" className={classes.clear} onClick={onClear}>
              Clear filters
            </button>
          </EmptyState>
        )}
      </main>
    </>
  );
};
