import type { z } from 'zod';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const attempt = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

const safeLocalStorage: StateStorage = {
  getItem: (name) => attempt(() => localStorage.getItem(name), null),
  setItem: (name, value) => attempt(() => localStorage.setItem(name, value), undefined),
  removeItem: (name) => attempt(() => localStorage.removeItem(name), undefined),
};

export const safeJSONStorage = <S>() => createJSONStorage<S>(() => safeLocalStorage);

export const mergeParsed =
  <T>(schema: z.ZodType<T>, fallback: () => T) =>
  <S>(persisted: unknown, current: S): S => {
    const parsed = schema.safeParse(persisted);
    return { ...current, ...(parsed.success ? parsed.data : fallback()) };
  };

interface PersistedStore {
  persist: { getOptions: () => { name?: string }; rehydrate: () => Promise<void> | void };
}

export const syncAcrossTabs = (...stores: PersistedStore[]): (() => void) => {
  const onStorage = (e: StorageEvent) => {
    if (e.storageArea !== localStorage) return;
    for (const store of stores) {
      if (e.key === null || e.key === store.persist.getOptions().name) void store.persist.rehydrate();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
};
