import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useLayoutEffect, useRef, useState } from 'react'

const OVERSCAN = 10

export const useWindowList = <T extends HTMLElement>(count: number, estimate: number) => {
  const ref = useRef<T>(null)
  const [margin, setMargin] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setMargin(Math.round(el.getBoundingClientRect().top + window.scrollY))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])

  const virtualizer = useWindowVirtualizer({
    count,
    estimateSize: () => estimate,
    overscan: OVERSCAN,
    scrollMargin: margin,
    useFlushSync: false,
  })
  const items = virtualizer.getVirtualItems()
  const first = items[0]
  const last = items.at(-1)
  return {
    ref,
    items,
    measure: virtualizer.measureElement,
    before: first ? first.start - margin : 0,
    after: last ? virtualizer.getTotalSize() - (last.end - margin) : 0,
  }
}
