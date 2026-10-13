import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { tournamentMediaQuery } from '~/api/queries'
import type { MediaItem } from '~/api/schemas'
import type { Match, Tournament } from '~/types'
import { linkMedia } from '~/utils/media'
import { hasStarted } from '~/utils/tournaments'

import { useSchedule } from './useTournaments'

const NO_ITEMS: MediaItem[] = []
const NO_MATCHES: Match[] = []

export const useTournamentMedia = (t: Tournament) => {
  const media = useQuery(tournamentMediaQuery(t))
  const { data: schedule } = useSchedule(t)
  const items = media.data?.items ?? NO_ITEMS
  const matches = schedule?.matches ?? NO_MATCHES
  const linked = useMemo(() => linkMedia(items, matches), [items, matches])
  return { ...linked, items, isLoading: media.isLoading, isError: media.isError, enabled: hasStarted(t) }
}

export const useMatchMedia = (t: Tournament, match: Match) => useTournamentMedia(t).byMatch.get(match.id)
