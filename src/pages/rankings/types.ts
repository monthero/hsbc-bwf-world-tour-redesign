import { z } from 'zod';

import { EventCode, RankingKind } from '~/api/schemas';

export const RankingsSearch = z.object({
  kind: RankingKind.optional().catch(undefined),
  ev: EventCode.optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  cc: z.string().optional().catch(undefined),
});

export type RankingsSearch = z.infer<typeof RankingsSearch>;
