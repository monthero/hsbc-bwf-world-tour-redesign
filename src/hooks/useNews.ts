import { useMemo } from 'react'

import { tournamentKey, type TournamentLookup } from '~/utils/news'

import { useTournamentsByCode } from './useTournaments'

export const useTournamentLookup = (): TournamentLookup | undefined => {
  const byCode = useTournamentsByCode()
  return useMemo(() => {
    if (!byCode) return undefined
    const all = [...byCode.values()]
    return {
      byCode,
      byName: new Map(all.map((t) => [tournamentKey(t.year, t.name), t])),
      byYear: Map.groupBy(all, (t) => t.year),
    }
  }, [byCode])
}
