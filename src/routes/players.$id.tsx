import { createFileRoute } from '@tanstack/react-router'

import { calendarQuery, playersQuery } from '~/api/queries'
import { PlayerPage } from '~/pages/player/PlayerPage'
import { PlayerSearch } from '~/pages/player/types'

export const Route = createFileRoute('/players/$id')({
  validateSearch: PlayerSearch,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(calendarQuery()),
      context.queryClient.ensureQueryData(playersQuery()),
    ]),
  component: PlayerPage,
})
