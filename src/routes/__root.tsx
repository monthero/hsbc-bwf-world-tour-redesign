import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useEffect, type FC } from 'react';

import { DisclaimerModal } from '~/components/disclaimer';
import { PageNotFound, SiteLayout } from '~/components/layout';
import { PlayerHoverCard } from '~/components/player';
import { PlayerHoverContext, type RenderPlayerHover } from '~/contexts';
import { useStoreSync } from '~/hooks/useStoreSync';
import { useThemeColorMeta } from '~/hooks/useThemeColorMeta';
import { markLanded } from '~/utils/landing';

const renderPlayerHover: RenderPlayerHover = (id, anchor) => <PlayerHoverCard id={id}>{anchor}</PlayerHoverCard>;

const RootLayout: FC = () => {
  useStoreSync();
  useThemeColorMeta();
  useEffect(markLanded, []);
  return (
    <>
      <SiteLayout>
        <PlayerHoverContext value={renderPlayerHover}>
          <Outlet />
        </PlayerHoverContext>
      </SiteLayout>
      <DisclaimerModal />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools buttonPosition="bottom-right" />
        </>
      )}
    </>
  );
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: PageNotFound,
});
