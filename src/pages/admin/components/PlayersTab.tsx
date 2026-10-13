import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useMemo, useState, type FC } from 'react';

import { EmptyState } from '~/components/ui';

import { useAdminPlayers, useEquipment } from '../api';
import { brandMatchers } from '../catalog';
import { buildRows, DEFAULT_ACTIVITY, DEFAULT_SORT, filterRows, type Criteria } from '../filters';
import type { AdminPlayer } from '../schema';
import type { AdminSearch } from '../types';
import { BulkEditor } from './BulkEditor';
import { FilterControls, FilterShell } from './FilterBar';
import { PlayerEditor } from './PlayerEditor';
import { PlayerTable } from './PlayerTable';
import { SelectionBar } from './SelectionBar';

import classes from './PlayersTab.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/admin');

const NAV = { replace: true, resetScroll: false } as const;

const NO_FLAGS: readonly string[] = [];
const NO_PLAYERS: readonly AdminPlayer[] = [];
const NO_IDS: ReadonlySet<string> = new Set();

export const PlayersTab: FC = () => {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { data, error } = useAdminPlayers();
  const [selected, setSelected] = useState(NO_IDS);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: catalog } = useEquipment('racket');
  const knownBrands = useMemo(() => brandMatchers(catalog?.brands ?? []), [catalog]);
  const { rows, countries, brands } = useMemo(
    () => buildRows(data?.players ?? NO_PLAYERS, knownBrands),
    [data, knownBrands],
  );
  const criteria = useMemo<Criteria>(
    () => ({
      query: search.q ?? '',
      cc: search.cc,
      brand: search.brand,
      ev: search.ev,
      active: search.active ?? DEFAULT_ACTIVITY,
      flags: search.flags ?? NO_FLAGS,
      sort: search.sort ?? DEFAULT_SORT,
    }),
    [search.q, search.cc, search.brand, search.ev, search.active, search.flags, search.sort],
  );
  const filtered = useMemo(() => filterRows(rows, criteria), [rows, criteria]);
  const filteredIds = useMemo(() => filtered.map((r) => r.player.id), [filtered]);
  const allFiltered = useMemo(
    () => filteredIds.length > 0 && filteredIds.every((id) => selected.has(id)),
    [filteredIds, selected],
  );
  const editing = useMemo(() => data?.players.find((p) => p.id === search.edit) ?? null, [data, search.edit]);
  const bulkPlayers = useMemo(
    () => (bulkOpen ? (data?.players.filter((p) => selected.has(p.id)) ?? NO_PLAYERS) : NO_PLAYERS),
    [bulkOpen, data, selected],
  );

  const patch = useCallback(
    (next: Partial<AdminSearch>) => void navigate({ search: (s) => ({ ...s, ...next }), ...NAV }),
    [navigate],
  );
  const onOpen = useCallback((id: string) => patch({ edit: id }), [patch]);
  const onClose = useCallback(() => patch({ edit: undefined }), [patch]);
  const onToggle = useCallback(
    (id: string) =>
      setSelected((s) => {
        const next = new Set(s);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );
  const onSelectAll = useCallback(() => setSelected((s) => new Set([...s, ...filteredIds])), [filteredIds]);
  const onToggleAll = useCallback(() => {
    if (!allFiltered) return onSelectAll();
    const drop = new Set(filteredIds);
    setSelected((s) => new Set([...s].filter((id) => !drop.has(id))));
  }, [allFiltered, filteredIds, onSelectAll]);
  const onClear = useCallback(() => setSelected(NO_IDS), []);
  const onBulk = useCallback(() => setBulkOpen(true), []);
  const onBulkClose = useCallback(() => setBulkOpen(false), []);

  return (
    <>
      <FilterShell>
        <FilterControls
          criteria={criteria}
          onPatch={patch}
          countries={countries}
          brands={brands}
          shown={filtered.length}
          total={rows.length}
        />
        <SelectionBar
          count={selected.size}
          filtered={filtered.length}
          allFiltered={allFiltered}
          onSelectAll={onSelectAll}
          onClear={onClear}
          onBulk={onBulk}
        />
      </FilterShell>
      <div className={clsx(utils.container, classes.body)}>
        {error && <EmptyState>Could not load players: {error.message}</EmptyState>}
        {data && !filtered.length && <EmptyState>No players match these filters</EmptyState>}
        {!!filtered.length && (
          <PlayerTable
            rows={filtered}
            selected={selected}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onOpen={onOpen}
          />
        )}
      </div>
      <PlayerEditor player={editing} onClose={onClose} />
      <BulkEditor opened={bulkOpen} onClose={onBulkClose} players={bulkPlayers} />
    </>
  );
};
