import { useCallback, useSyncExternalStore } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode = 'prompt' | 'share';

const STANDALONE = '(display-mode: standalone), (display-mode: fullscreen)';

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

const isStandalone = () =>
  window.matchMedia(STANDALONE).matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isAppleMobile = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const modeOf = (): InstallMode | null => {
  if (typeof window === 'undefined' || isStandalone()) return null;
  if (deferred) return 'prompt';
  return isAppleMobile() && typeof navigator.share === 'function' ? 'share' : null;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const serverMode = () => null;

export const useInstallApp = () => {
  const mode = useSyncExternalStore(subscribe, modeOf, serverMode);
  const install = useCallback(async () => {
    if (deferred) {
      const prompt = deferred;
      await prompt.prompt();
      await prompt.userChoice;
      deferred = null;
      notify();
      return;
    }
    await navigator.share({ title: document.title, url: window.location.href }).catch(() => undefined);
  }, []);
  return { mode, install };
};
