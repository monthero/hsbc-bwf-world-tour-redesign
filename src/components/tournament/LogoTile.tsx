import { clsx } from 'clsx';
import { type CSSProperties, type FC } from 'react';

import { useImageState } from '~/hooks/useImageState';
import { initials } from '~/utils/names';

import classes from './LogoTile.module.css';

export const LogoTile: FC<{
  src: string;
  size: number | string;
  flat?: boolean;
  eager?: boolean;
  name?: string;
  alt?: string;
  className?: string;
}> = ({ src, size, flat, eager, name, alt = '', className }) => {
  const { img, loaded, failed } = useImageState(src);
  const label = name ?? alt;
  return (
    <span
      className={clsx(classes.tile, className)}
      data-flat={flat || undefined}
      style={{ '--size': typeof size === 'number' ? `${size}px` : size } as CSSProperties}
    >
      {!loaded && label && (
        <span className={classes.mono} aria-hidden>
          {initials(label)}
        </span>
      )}
      {!failed && <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} {...img} />}
    </span>
  );
};
