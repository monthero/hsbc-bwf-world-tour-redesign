import { useRouterState } from '@tanstack/react-router';
import { createContext, use, useMemo } from 'react';

import type { InternalItem } from '../links';

export interface MenuLocation {
  path: string;
  key: string;
}

export const MenuLocationContext = createContext<MenuLocation | null>(null);

export const useMenuLocation = (): MenuLocation => {
  const override = use(MenuLocationContext);
  const path = useRouterState({ select: (s) => s.location.pathname });
  return useMemo(() => override ?? { path, key: path }, [override, path]);
};

export const isSectionActive = (item: InternalItem, path: string) => item.sections.some((p) => path.startsWith(p));

export const useSectionActive = (item: InternalItem) => isSectionActive(item, useMenuLocation().path);
