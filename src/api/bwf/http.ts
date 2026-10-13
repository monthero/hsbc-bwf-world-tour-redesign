import type { z } from 'zod'

import { ApiError } from '../client'

const BASE = import.meta.env.VITE_BWF_API_BASE ?? '/bwf-api'
const TIMEOUT_MS = 15_000

export const bwfGet = async <S extends z.ZodType>(
  path: string,
  params: Record<string, string | number>,
  schema: S,
  signal?: AbortSignal,
): Promise<z.infer<S>> => {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))
  const url = `${BASE}/${path}?${query}`
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
  if (!res.ok) throw new ApiError(res.status, url)
  return schema.parse(await res.json())
}
