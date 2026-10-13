import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, DefaultGlobalNotFound, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { FC } from 'react'

import { DisclaimerModal } from '~/components/disclaimer'
import { SiteFooter, SiteHeader } from '~/components/layout'
import { PlayerHoverCard } from '~/components/player'
import { NOT_FOUND } from '~/constants'
import { PlayerHoverContext, type RenderPlayerHover } from '~/contexts'
import { useDocumentTitle } from '~/hooks/useDocumentTitle'
import { useTabSync } from '~/hooks/useTabSync'

const renderPlayerHover: RenderPlayerHover = (id, anchor) => <PlayerHoverCard id={id}>{anchor}</PlayerHoverCard>

const NotFound: FC = () => {
  useDocumentTitle(NOT_FOUND, 'bwf')
  return <DefaultGlobalNotFound />
}

const RootLayout: FC = () => {
  useTabSync()
  return (
    <>
      <SiteHeader />
      <PlayerHoverContext value={renderPlayerHover}>
        <Outlet />
      </PlayerHoverContext>
      <SiteFooter />
      <DisclaimerModal />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools buttonPosition="bottom-right" />
        </>
      )}
    </>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})
