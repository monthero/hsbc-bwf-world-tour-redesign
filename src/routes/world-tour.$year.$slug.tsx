import { createFileRoute } from '@tanstack/react-router';

import { calendarQuery } from '~/api/queries';
import { TournamentPage } from '~/pages/tournament/TournamentPage';
import { TournamentSearch } from '~/pages/tournament/types';

export const Route = createFileRoute('/world-tour/$year/$slug')({
  validateSearch: TournamentSearch,
  loader: ({ context, params }) => context.queryClient.ensureQueryData(calendarQuery(Number(params.year))),
  component: TournamentPage,
});
