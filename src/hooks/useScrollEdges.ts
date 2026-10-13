import { useEffect, useState, type RefObject } from 'react'

export type ScrollEdges = { start: boolean; end: boolean }

const NONE: ScrollEdges = { start: false, end: false }

const measure = (el: HTMLElement): ScrollEdges => {
  const max = el.scrollWidth - el.clientWidth
  return { start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 }
}

export const useScrollEdges = (ref: RefObject<HTMLElement | null>) => {
  const [edges, setEdges] = useState(NONE)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const next = measure(el)
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next))
    }
    const ro = new ResizeObserver(update)
    const observe = () => {
      ro.disconnect()
      ro.observe(el)
      for (const child of el.children) ro.observe(child)
      update()
    }
    const mo = new MutationObserver(observe)
    mo.observe(el, { childList: true })
    el.addEventListener('scroll', update, { passive: true })
    observe()
    return () => {
      el.removeEventListener('scroll', update)
      mo.disconnect()
      ro.disconnect()
    }
  }, [ref])
  return edges
}
