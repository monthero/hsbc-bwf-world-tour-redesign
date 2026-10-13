import { createFileRoute } from '@tanstack/react-router';

import { rankingTableQuery } from '~/api/queries';
import { DEFAULT_KIND } from '~/pages/rankings/constants';
import { RankingsPage } from '~/pages/rankings/RankingsPage';
import { RankingsSearch } from '~/pages/rankings/types';

export const Route = createFileRoute('/rankings')({
  validateSearch: RankingsSearch,
  loaderDeps: ({ search }) => ({ kind: search.kind ?? DEFAULT_KIND }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(rankingTableQuery(deps.kind)),
  component: RankingsPage,
});
