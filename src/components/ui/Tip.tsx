import { Tooltip, type TooltipProps } from '@mantine/core';
import { clsx } from 'clsx';
import {
  cloneElement,
  useEffect,
  useState,
  type FC,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { TIP_DELAY } from './tipDelay';

import classes from './Tip.module.css';

interface TriggerProps {
  className?: string;
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLElement>) => void;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
}

export type TipProps = Omit<TooltipProps, 'children' | 'label' | 'target' | 'opened'> & {
  label: ReactNode;
  children: ReactElement<TriggerProps>;
  tap?: boolean;
};

const isAction = (el: HTMLElement) => el.matches('a[href], button');

const byTouch = (e: MouseEvent) => {
  const type = (e.nativeEvent as Partial<globalThis.PointerEvent>).pointerType;
  return !!type && type !== 'mouse';
};

export const Tip: FC<TipProps> = ({ label, children, tap = true, disabled, ...tooltip }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [tapped, setTapped] = useState(false);
  const active = !!label && !disabled;
  const own = children.props;

  useEffect(() => {
    if (!tapped || !target) return;
    const outside = (e: Event) => {
      if (!(e.target instanceof Node && target.contains(e.target))) setTapped(false);
    };
    const close = () => setTapped(false);
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('scroll', close, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [tapped, target]);

  const arm = (el: HTMLElement) => {
    if (active && !target) setTarget(el);
  };

  const trigger: TriggerProps = {
    className: clsx(own.className, active && tap && classes.tip),
    onPointerEnter: (e) => {
      own.onPointerEnter?.(e);
      arm(e.currentTarget);
    },
    onFocus: (e) => {
      own.onFocus?.(e);
      arm(e.currentTarget);
    },
    onPointerUp: (e) => {
      own.onPointerUp?.(e);
      if (!active || !tap || e.pointerType === 'mouse') return;
      setTarget(e.currentTarget);
      setTapped((open) => !open);
    },
    onClick: (e) => {
      own.onClick?.(e);
      if (!active || !tap || !byTouch(e) || isAction(e.currentTarget)) return;
      e.preventDefault();
      e.stopPropagation();
    },
  };

  return (
    <>
      {cloneElement(children, trigger)}
      {active && target && (
        <Tooltip openDelay={TIP_DELAY.open} {...tooltip} target={target} label={label} opened={tapped || undefined} />
      )}
    </>
  );
};
