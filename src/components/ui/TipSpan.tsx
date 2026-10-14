import { clsx } from 'clsx';
import { memo, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { LazyTip } from './LazyTip';
import { useLazyTip } from './useLazyTip';

import classes from './TipSpan.module.css';

export const TipSpan = memo<ComponentPropsWithoutRef<'span'> & { tip: ReactNode }>(({ tip, className, ...rest }) => {
  const lazy = useLazyTip<HTMLSpanElement>(!!tip);
  return (
    <>
      <span {...rest} className={clsx(tip ? classes.tip : undefined, className)} onPointerEnter={lazy.arm} />
      <LazyTip target={lazy.target} label={tip} />
    </>
  );
});
