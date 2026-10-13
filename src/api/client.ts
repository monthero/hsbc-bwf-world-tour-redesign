import type { z } from 'zod'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, url: string) {
    super(`Request failed (${status}): ${url}`)
    this.status = status
  }
}

export async function getJson<S extends z.ZodType>(url: string, schema: S, signal?: AbortSignal): Promise<z.infer<S>> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new ApiError(res.status, url)
  return schema.parse(await res.json())
}

export const fetchJson = <S extends z.ZodType>(path: string, schema: S, signal?: AbortSignal) =>
  getJson(`${import.meta.env.BASE_URL}data/${path}`, schema, signal)
