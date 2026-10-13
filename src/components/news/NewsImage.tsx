import { clsx } from 'clsx';
import { memo, type ReactNode } from 'react';

import type { NewsImage as NewsImageData } from '~/api/schemas';
import { useImageState } from '~/hooks/useImageState';
import { newsImageSrcSet, newsImageUrl, type NewsRatio } from '~/utils/news';

import classes from './NewsImage.module.css';

export const NewsImage = memo<{
  image: NewsImageData | null;
  ratio: NewsRatio;
  widths: readonly number[];
  sizes: string;
  eager?: boolean;
  className?: string;
  children?: ReactNode;
}>(({ image, ratio, widths, sizes, eager, className, children }) => {
  const src = image ? newsImageUrl(image, widths[0] ?? 480, ratio) : '';
  const { ref, onLoad, onError, loaded, failed } = useImageState(src);
  const shown = failed ? null : image;
  return (
    <span className={clsx(classes.frame, className)} data-ratio={ratio} data-fallback={shown ? undefined : true}>
      {shown && (
        <img
          className={classes.img}
          src={src}
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
  );
});
