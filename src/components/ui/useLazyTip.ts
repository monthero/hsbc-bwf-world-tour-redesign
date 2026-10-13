import { useState, type PointerEvent } from 'react'

export const TIP_DELAY = { open: 300, close: 120 }

export const useLazyTip = <T extends HTMLElement>(enabled: boolean) => {
  const [target, setTarget] = useState<T | null>(null)
  const arm = enabled && !target ? (e: PointerEvent<T>) => setTarget(e.currentTarget) : undefined
  return { target: enabled ? target : null, arm }
}
