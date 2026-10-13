import { useEffect } from 'react';

import { useDisclaimer } from '~/stores/disclaimer';
import { useFavorites } from '~/stores/favorites';
import { syncAcrossTabs } from '~/stores/persistence';
import { useSettings } from '~/stores/settings';

export const useStoreSync = () => {
  useEffect(() => syncAcrossTabs(useFavorites, useDisclaimer, useSettings), []);
};
