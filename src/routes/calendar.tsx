import { createFileRoute } from '@tanstack/react-router';

import { calendarQuery } from '~/api/queries';
import { CalendarPage } from '~/pages/calendar/CalendarPage';
import { CalendarSearch } from '~/pages/calendar/types';

export const Route = createFileRoute('/calendar')({
  validateSearch: CalendarSearch,
  loaderDeps: ({ search }) => ({ year: search.year }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(calendarQuery(deps.year)),
  component: CalendarPage,
});
