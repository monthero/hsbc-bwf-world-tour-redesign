import { z } from 'zod'

import { EventCode } from '~/api/schemas'

export const SortKey = z.enum(['rank', 'name', 'recent'])
export type SortKey = z.infer<typeof SortKey>

export const Activity = z.enum(['all', 'season', 'year'])
export type Activity = z.infer<typeof Activity>

export const AdminSearch = z.object({
  q: z.string().optional().catch(undefined),
  cc: z.string().optional().catch(undefined),
  brand: z.string().optional().catch(undefined),
  ev: EventCode.optional().catch(undefined),
  active: Activity.optional().catch(undefined),
  flags: z.array(z.string()).optional().catch(undefined),
  sort: SortKey.optional().catch(undefined),
  edit: z.union([z.string(), z.number()]).transform(String).optional().catch(undefined),
})
export type AdminSearch = z.infer<typeof AdminSearch>
