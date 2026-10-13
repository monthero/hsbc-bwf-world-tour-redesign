import { useQuery } from '@tanstack/react-query'

import { rankingTableQuery } from '~/api/queries'
import type { RankingKind } from '~/types'

export const useRankingTable = (kind: RankingKind) => useQuery(rankingTableQuery(kind))
