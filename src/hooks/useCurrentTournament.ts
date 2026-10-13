import { use, useMemo } from 'react';

import { TournamentContext } from '~/contexts';

export const useCurrentTournament = () => use(TournamentContext);

export const usePlayerLinkSearch = () => {
  const code = use(TournamentContext)?.code;
  return useMemo(() => (code ? { from: code } : {}), [code]);
};
