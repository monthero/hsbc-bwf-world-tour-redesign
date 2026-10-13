import { createFileRoute } from '@tanstack/react-router'

import { calendarQuery } from '~/api/queries'
import { SEASON_YEAR } from '~/constants'
import { AboutPage } from '~/pages/about/AboutPage'

export const Route = createFileRoute('/about')({
  loader: ({ context }) => context.queryClient.ensureQueryData(calendarQuery(SEASON_YEAR)),
  component: AboutPage,
})
