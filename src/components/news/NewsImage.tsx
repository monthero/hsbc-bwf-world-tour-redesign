import { clsx } from 'clsx'
import { memo, useCallback, useState, type ReactNode } from 'react'

import type { NewsImage as NewsImageData } from '~/api/schemas'
import { newsImageSrcSet, newsImageUrl, type NewsRatio } from '~/utils/news'

import classes from './NewsImage.module.css'

export const NewsImage = memo<{
  image: NewsImageData | null
  ratio: NewsRatio
  widths: readonly number[]
  sizes: string
  eager?: boolean
  className?: string
  children?: ReactNode
}>(({ image, ratio, widths, sizes, eager, className, children }) => {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])
  const onError = useCallback(() => setFailed(true), [])
  const shown = failed ? null : image
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth) setLoaded(true)
  }, [])
  return (
    <span className={clsx(classes.frame, className)} data-ratio={ratio} data-fallback={shown ? undefined : true}>
      {shown && (
        <img
          className={classes.img}
          src={newsImageUrl(shown, widths[0] ?? 480, ratio)}
          srcSet={newsImageSrcSet(shown, widths, ratio)}
          sizes={sizes}
          alt={shown.caption ?? ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          ref={ref}
          onLoad={onLoad}
          onError={onError}
          data-loaded={loaded || undefined}
        />
      )}
      {children}
    </span>
  )
})
