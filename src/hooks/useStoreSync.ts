import { useEffect } from 'react';

import { useDisclaimer } from '~/stores/disclaimer';
import { useFavorites } from '~/stores/favorites';
import { syncAcrossTabs } from '~/stores/persistence';

export const useStoreSync = () => {
  useEffect(() => syncAcrossTabs(useFavorites, useDisclaimer), []);
};
