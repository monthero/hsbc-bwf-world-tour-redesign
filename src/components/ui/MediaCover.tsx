import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { useImageState } from '~/hooks/useImageState';

import classes from './MediaCover.module.css';
import utils from '~/styles/utils.module.css';

export const MediaCover: FC<{
  src: string;
  position?: string;
  fade?: 'bottom' | 'strong' | 'none';
  muted?: boolean;
  priority?: boolean;
  className?: string;
  children?: ReactNode;
}> = ({ src, position, fade = 'bottom', muted, priority, className, children }) => {
  const { img, failed } = useImageState(src);
  return (
    <div className={clsx(classes.media, className)} data-fade={fade} data-muted={muted || undefined}>
      {!failed && (
        <img
          className={clsx(utils.cover, classes.img)}
          src={src}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          style={position ? { objectPosition: position } : undefined}
          {...img}
        />
      )}
      {children}
    </div>
  );
};
