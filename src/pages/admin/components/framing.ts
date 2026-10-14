import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

import type { Focus } from '~/types';

export interface Framing<F extends Focus> {
  focus: F | null;
  flip: boolean;
}

export interface FramingEditorProps<F extends Focus> {
  focus: F | null;
  flip: boolean;
  flipBlocked?: string;
  busy?: boolean;
  status?: ReactNode;
  onChange: (next: Framing<F>) => void;
}

const STEP = 1;
const BIG_STEP = 5;

const ARROWS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export const clampPercent = (n: number, digits = 0) => {
  const scale = 10 ** digits;
  return Math.min(100, Math.max(0, Math.round(n * scale) / scale));
};

export const arrowNudge = (e: KeyboardEvent<HTMLElement>) => {
  const arrow = ARROWS[e.key];
  if (!arrow) return null;
  e.preventDefault();
  const step = e.shiftKey ? BIG_STEP : STEP;
  return { dx: arrow[0] * step, dy: arrow[1] * step };
};

export const useFramingEditor = <F extends Focus>({
  focus,
  flip,
  flipBlocked,
  busy = false,
  status,
  onChange,
}: FramingEditorProps<F>) => {
  const [drag, setDrag] = useState<F | null>(null);
  const onCommit = useCallback((next: F) => onChange({ focus: next, flip }), [onChange, flip]);
  const onFlip = useCallback((next: boolean) => onChange({ focus, flip: next }), [onChange, focus]);
  const onReset = useCallback(() => onChange({ focus: null, flip: false }), [onChange]);
  const controls = useMemo(
    () => ({ flip, flipBlocked, busy, resettable: !!focus || flip, status, onFlip, onReset }),
    [flip, flipBlocked, busy, focus, status, onFlip, onReset],
  );
  return { shown: drag ?? focus, setDrag, onCommit, controls };
};

export const mirrored = <F extends Focus>(focus: F | null): F | null => focus && { ...focus, x: 100 - focus.x };

type Handler = (e: PointerEvent<HTMLElement>) => void;

export const useDrag = <T>(
  begin: (e: PointerEvent<HTMLElement>) => T,
  move: (start: T, e: PointerEvent<HTMLElement>) => void,
  end: (start: T, e: PointerEvent<HTMLElement>) => void,
): Record<'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel', Handler> => {
  const start = useRef<{ value: T } | null>(null);
  const finish: Handler = (e) => {
    const from = start.current;
    if (!from) return;
    start.current = null;
    end(from.value, e);
  };
  return {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { value: begin(e) };
    },
    onPointerMove: (e) => {
      if (start.current) move(start.current.value, e);
    },
    onPointerUp: finish,
    onPointerCancel: finish,
  };
};
