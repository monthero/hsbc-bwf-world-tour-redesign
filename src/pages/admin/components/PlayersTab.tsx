import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useMemo, useState, type FC } from 'react';

import { EmptyState } from '~/components/ui';
import { downloadText } from '~/utils/download';
import { STAY } from '~/utils/navigation';

import { useAdminPlayers, useCatalog } from '../api';
import { catalogNames, type BrandMatcher } from '../catalog';
import { exportCsv } from '../csv';
import { todayStamp } from '../fields';
import { buildRows, DEFAULT_ACTIVITY, DEFAULT_SORT, filterRows, type Criteria } from '../filters';
import type { AdminPlayer } from '../schema';
import type { AdminSearch } from '../types';
import { BulkEditor } from './BulkEditor';
import { FilterControls, FilterShell } from './FilterBar';
import { ImportCsv } from './ImportCsv';
import { PlayerEditor, type EditorPartner } from './PlayerEditor';
import { PlayerTable } from './PlayerTable';
import { SelectionBar } from './SelectionBar';

import classes from './PlayersTab.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/admin');

const NO_FLAGS: readonly string[] = [];
const NO_PLAYERS: readonly AdminPlayer[] = [];
const NO_PARTNERS: readonly EditorPartner[] = [];
const NO_IDS: ReadonlySet<string> = new Set();
const NO_MATCHERS: readonly BrandMatcher[] = [];
const NO_NAMES = catalogNames([]);

export const PlayersTab: FC = () => {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { data, error } = useAdminPlayers();
  const [selected, setSelected] = useState(NO_IDS);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: catalog } = useCatalog();
  const knownBrands = catalog?.matchers ?? NO_MATCHERS;
  const names = catalog?.names ?? NO_NAMES;
  const { rows, countries, brands } = useMemo(
    () => buildRows(data?.players ?? NO_PLAYERS, knownBrands, names),
    [data, knownBrands, names],
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
  const byId = useMemo(() => new Map((data?.players ?? NO_PLAYERS).map((p) => [p.id, p])), [data]);
  const editing = (search.edit && byId.get(search.edit)) || null;
  const partners = useMemo(
    () =>
      editing?.partners.flatMap(({ id, ...rest }): EditorPartner[] => {
        const player = byId.get(id);
        return player ? [{ ...rest, player }] : [];
      }) ?? NO_PARTNERS,
    [editing, byId],
  );
  const bulkPlayers = useMemo(
    () => (bulkOpen ? (data?.players.filter((p) => selected.has(p.id)) ?? NO_PLAYERS) : NO_PLAYERS),
    [bulkOpen, data, selected],
  );

  const patch = useCallback(
    (next: Partial<AdminSearch>) => void navigate({ search: (s) => ({ ...s, ...next }), ...STAY }),
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
  const onImport = useCallback(() => setImportOpen(true), []);
  const onImportClose = useCallback(() => setImportOpen(false), []);
  const onExport = useCallback(() => {
    const players = selected.size
      ? (data?.players.filter((p) => selected.has(p.id)) ?? NO_PLAYERS)
      : filtered.map((r) => r.player);
    downloadText(`bwf-players-${todayStamp()}.csv`, exportCsv(players, names));
  }, [selected, data, filtered, names]);

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
          onImport={onImport}
          onExport={onExport}
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
      <PlayerEditor player={editing} partners={partners} onClose={onClose} onSwitch={onOpen} />
      <BulkEditor opened={bulkOpen} onClose={onBulkClose} players={bulkPlayers} />
      <ImportCsv opened={importOpen} onClose={onImportClose} players={data?.players ?? NO_PLAYERS} />
    </>
  );
};
