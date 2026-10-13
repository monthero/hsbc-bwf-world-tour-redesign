import { useCallback, useState, type RefCallback } from 'react';

type Status = { src: string; state: 'loaded' | 'failed' };

export const useImageState = (src: string) => {
  const [status, setStatus] = useState<Status | null>(null);
  const onLoad = useCallback(() => setStatus({ src, state: 'loaded' }), [src]);
  const onError = useCallback(() => setStatus({ src, state: 'failed' }), [src]);
  const ref = useCallback<RefCallback<HTMLImageElement>>(
    (el) => {
      if (el?.complete && el.naturalWidth) setStatus({ src, state: 'loaded' });
    },
    [src],
  );
  const state = status?.src === src ? status.state : null;
  return { ref, onLoad, onError, loaded: state === 'loaded', failed: !src || state === 'failed' };
};
