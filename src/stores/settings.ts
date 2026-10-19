import type { MantineColorSchemeManager } from '@mantine/core';
import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { HEIGHT_UNITS, TENSION_UNITS } from '~/utils/format';

import { mergeParsed, safeJSONStorage } from './persistence';

const STORAGE_KEY = 'bwf-settings';
const STORE_VERSION = 1;

export const TimeZoneMode = z.enum(['mine', 'venue']);
export type TimeZoneMode = z.infer<typeof TimeZoneMode>;

export const ClockMode = z.enum(['24h', '12h']);
export type ClockMode = z.infer<typeof ClockMode>;

export const ColorScheme = z.enum(['light', 'dark', 'auto']);
export type ColorScheme = z.infer<typeof ColorScheme>;

export const HeightUnit = z.enum(HEIGHT_UNITS);
export type HeightUnit = z.infer<typeof HeightUnit>;

export const TensionUnit = z.enum(TENSION_UNITS);
export type TensionUnit = z.infer<typeof TensionUnit>;

const SettingsData = z.object({
  colorScheme: ColorScheme.catch('dark'),
  timeZone: TimeZoneMode.catch('mine'),
  clock: ClockMode.catch('24h'),
  height: HeightUnit.catch('cm'),
  tension: TensionUnit.catch('lbs'),
  showBlocked: z.boolean().catch(true),
});
export type SettingsData = z.infer<typeof SettingsData>;

interface SettingsState extends SettingsData {
  set: (patch: Partial<SettingsData>) => void;
  reset: () => void;
}

const DEFAULTS: SettingsData = SettingsData.parse({});

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (patch) => set(patch),
      reset: () => set(DEFAULTS),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: safeJSONStorage<SettingsData>(),
      partialize: ({ colorScheme, timeZone, clock, height, tension, showBlocked }): SettingsData => ({
        colorScheme,
        timeZone,
        clock,
        height,
        tension,
        showBlocked,
      }),
      migrate: () => DEFAULTS,
      merge: mergeParsed(SettingsData, () => DEFAULTS),
    },
  ),
);

const SETTING_KEYS = Object.keys(DEFAULTS) as (keyof SettingsData)[];

export const useHeightUnit = () => useSettings((s) => s.height);

export const useTensionUnit = () => useSettings((s) => s.tension);

export const useShowBlocked = () => useSettings((s) => s.showBlocked);

export const useSettingsChanged = () => useSettings((s) => SETTING_KEYS.some((k) => s[k] !== DEFAULTS[k]));

export const settingsColorSchemeManager = (): MantineColorSchemeManager => {
  let stop: (() => void) | undefined;
  return {
    get: (fallback) => useSettings.getState().colorScheme ?? fallback,
    set: (colorScheme) => {
      if (useSettings.getState().colorScheme !== colorScheme) useSettings.getState().set({ colorScheme });
    },
    subscribe: (onUpdate) => {
      stop?.();
      stop = useSettings.subscribe((s, prev) => {
        if (s.colorScheme !== prev.colorScheme) onUpdate(s.colorScheme);
      });
    },
    unsubscribe: () => {
      stop?.();
      stop = undefined;
    },
    clear: () => useSettings.getState().set({ colorScheme: 'dark' }),
  };
};
