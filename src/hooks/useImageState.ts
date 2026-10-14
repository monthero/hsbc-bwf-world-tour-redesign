import { useCallback, useMemo, useState, type RefCallback } from 'react';

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
  const loaded = state === 'loaded';
  const img = useMemo(
    () => ({ ref, onLoad, onError, 'data-loaded': loaded || undefined }),
    [ref, onLoad, onError, loaded],
  );
  return { img, loaded, failed: !src || state === 'failed' };
};
