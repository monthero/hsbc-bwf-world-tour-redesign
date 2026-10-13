import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { safeJSONStorage } from './persistence'

const STORAGE_KEY = 'bwf-disclaimer'
const STORE_VERSION = 1

const DisclaimerData = z.object({ acknowledgedAt: z.number().nullable().catch(null) })
type DisclaimerData = z.infer<typeof DisclaimerData>

interface DisclaimerState extends DisclaimerData {
  acknowledge: () => void
}

const EMPTY: DisclaimerData = { acknowledgedAt: null }

const parseData = (raw: unknown): DisclaimerData => {
  const parsed = DisclaimerData.safeParse(raw)
  return parsed.success ? parsed.data : EMPTY
}

export const useDisclaimer = create<DisclaimerState>()(
  persist(
    (set) => ({
      ...EMPTY,
      acknowledge: () => set({ acknowledgedAt: Date.now() }),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: safeJSONStorage<DisclaimerData>(),
      partialize: (s): DisclaimerData => ({ acknowledgedAt: s.acknowledgedAt }),
      migrate: () => EMPTY,
      merge: (persisted, current) => ({ ...current, ...parseData(persisted) }),
    },
  ),
)

export const useDisclaimerAcknowledged = (): boolean => useDisclaimer((s) => s.acknowledgedAt !== null)
