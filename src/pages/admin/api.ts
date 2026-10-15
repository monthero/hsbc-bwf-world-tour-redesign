import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { z } from 'zod';

import { getJson } from '~/api/client';
import { playerQuery, playersQuery } from '~/api/queries';

import {
  AdminPlayers,
  ApiFailure,
  BulkResult,
  BrandAdded,
  EquipmentAdded,
  EquipmentList,
  ImageResult,
  SaveResult,
  type BulkRequest,
  type ImportRequest,
  type BrandInput,
  type EquipmentInput,
  type EquipmentKind,
  type ImageRequest,
  type PlayerOverride,
} from './schema';

const ADMIN_API = '/admin-api';

const send = async <S extends z.ZodType>(path: string, method: string, body: unknown, schema: S) => {
  const res = await fetch(`${ADMIN_API}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(ApiFailure.safeParse(json).data?.error ?? `Request failed (${res.status})`);
  return schema.parse(json) as z.infer<S>;
};

const adminPlayersQuery = () =>
  queryOptions({
    queryKey: ['admin', 'players'],
    queryFn: ({ signal }) => getJson(`${ADMIN_API}/players`, AdminPlayers, signal),
    staleTime: Infinity,
  });

export const useAdminPlayers = () => useQuery(adminPlayersQuery());

type Entries = Record<string, PlayerOverride | null>;

const PLAYER_KEY = playerQuery('').queryKey[0];

const useApplyEntries = () => {
  const client = useQueryClient();
  const apply = useCallback(
    (entries: Entries) => {
      client.setQueryData(adminPlayersQuery().queryKey, (d) =>
        d
          ? {
              players: d.players.map((p) =>
                Object.hasOwn(entries, p.id) ? { ...p, override: entries[p.id] ?? null } : p,
              ),
            }
          : d,
      );
      return Promise.all([
        client.invalidateQueries({ queryKey: playersQuery().queryKey }),
        client.invalidateQueries({
          predicate: (q) => q.queryKey[0] === PLAYER_KEY && Object.hasOwn(entries, String(q.queryKey[1])),
        }),
        client.invalidateQueries({ queryKey: ['ranking-table'] }),
      ]);
    },
    [client],
  );
  const resync = useCallback(() => client.invalidateQueries({ queryKey: adminPlayersQuery().queryKey }), [client]);
  return { apply, resync };
};

export const useSaveOverride = (id: string) => {
  const { apply, resync } = useApplyEntries();
  return useMutation({
    mutationFn: (entry: PlayerOverride | null) => send(`/overrides/players/${id}`, 'PUT', entry ?? {}, SaveResult),
    onSuccess: ({ entry }) => apply({ [id]: entry }),
    onError: resync,
  });
};

export const useBulkOverride = () => {
  const { apply, resync } = useApplyEntries();
  return useMutation({
    mutationFn: (req: BulkRequest) => send('/overrides/players', 'PATCH', req, BulkResult),
    onSuccess: ({ entries }) => apply(entries),
    onError: resync,
  });
};

export const useImportOverrides = () => {
  const { apply, resync } = useApplyEntries();
  return useMutation({
    mutationFn: (req: ImportRequest) => send('/overrides/import', 'POST', req, BulkResult),
    onSuccess: ({ entries }) => apply(entries),
    onError: resync,
  });
};

export const useFetchImage = () =>
  useMutation({ mutationFn: (req: ImageRequest) => send('/images', 'POST', req, ImageResult) });

const EQUIPMENT_KEY = ['admin', 'equipment'] as const;

const equipmentQuery = (kind: EquipmentKind) =>
  queryOptions({
    queryKey: [...EQUIPMENT_KEY, kind],
    queryFn: ({ signal }) => getJson(`${ADMIN_API}/equipment?kind=${kind}`, EquipmentList, signal),
    staleTime: Infinity,
  });

export const useEquipment = (kind: EquipmentKind) => useQuery(equipmentQuery(kind));

export const useAddEquipment = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: EquipmentInput) => send('/equipment', 'POST', input, EquipmentAdded),
    onSuccess: ({ rows, brands }, { kind }) => client.setQueryData(equipmentQuery(kind).queryKey, { rows, brands }),
  });
};

export const useAddBrand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BrandInput) => send('/brands', 'POST', input, BrandAdded),
    onSuccess: () => client.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
};
