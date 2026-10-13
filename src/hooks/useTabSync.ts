import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useDisclaimer } from '~/stores/disclaimer'
import { useFavorites } from '~/stores/favorites'
import { syncAcrossTabs } from '~/stores/persistence'

const CHANNEL = 'bwf-nav'

export function useTabSync() {
  const router = useRouter()

  useEffect(() => syncAcrossTabs(useFavorites, useDisclaimer), [])

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(CHANNEL)
    let incoming: string | null = null

    channel.onmessage = (e: MessageEvent<string>) => {
      if (e.data === router.state.location.href) return
      incoming = e.data
      void router.navigate({ href: e.data, replace: true })
    }

    const unsubscribe = router.subscribe('onResolved', ({ toLocation }) => {
      if (toLocation.href === incoming) {
        incoming = null
        return
      }
      channel.postMessage(toLocation.href)
    })

    return () => {
      unsubscribe()
      channel.close()
    }
  }, [router])
}
