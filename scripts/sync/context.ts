import type { loadCatalog } from './catalog.ts'
import type { Db } from './db.ts'
import type { Client } from './http.ts'

export interface Context {
  db: Db
  client: Client
  catalog: ReturnType<typeof loadCatalog>
  years: number[]
  currentYear: number
  today: string
}
