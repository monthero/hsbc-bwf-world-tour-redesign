import { createFileRoute, redirect } from '@tanstack/react-router';

import { findLiveTournament } from '~/hooks/useTournaments';
import { isLanding } from '~/utils/landing';
import { tournamentLink } from '~/utils/tournaments';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const live = isLanding() ? await findLiveTournament(context.queryClient) : undefined;
    if (live) throw redirect({ ...tournamentLink(live), search: { tab: 'matches' }, replace: true });
    throw redirect({ to: '/calendar', replace: true });
  },
});
