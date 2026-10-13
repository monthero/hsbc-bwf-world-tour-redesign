import { getRouteApi } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'

import { useTournamentNews } from '~/api/news'
import { SEASON_YEAR } from '~/constants'
import { useDraw, useEntries, useTournaments } from '~/hooks/useTournaments'
import type { Tournament, TournamentSchedule } from '~/types'
import { finalsOf, roadTo } from '~/utils/tournaments'

import { mergeDraw, tabAvailability } from './utils'

const route = getRouteApi('/world-tour/$year/$slug')

export const useOpenMatch = () => {
  const navigate = route.useNavigate()
  return useCallback(
    (match: string) => void navigate({ search: (s) => ({ ...s, match }), resetScroll: false }),
    [navigate],
  )
}

export const useCloseMatch = () => {
  const navigate = route.useNavigate()
  return useCallback(
    () => void navigate({ search: (s) => ({ ...s, match: undefined }), replace: true, resetScroll: false }),
    [navigate],
  )
}

export const useCalendarBack = (year: number) => {
  const { data } = useTournaments(year)
  const finals = finalsOf(data)
  return useMemo(
    () => ({
      link: { to: '/calendar', search: { year: year === SEASON_YEAR ? undefined : year } } as const,
      label: roadTo(finals),
    }),
    [year, finals],
  )
}

export const useTabData = (t: Tournament, schedule: TournamentSchedule | undefined) => {
  const { data: slots } = useDraw(t)
  const { data: entries } = useEntries(t)
  const { data: news } = useTournamentNews(t)
  const draw = useMemo(() => (slots && schedule ? mergeDraw(slots, schedule.matches) : null), [slots, schedule])
  const available = useMemo(
    () => (schedule ? tabAvailability(schedule, draw, entries, news) : null),
    [schedule, draw, entries, news],
  )
  return { draw, entries, available }
}
