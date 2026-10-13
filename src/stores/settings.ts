import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { HEIGHT_UNITS } from '~/utils/format';

import { safeJSONStorage } from './persistence';

const STORAGE_KEY = 'bwf-settings';
const STORE_VERSION = 1;

export const TimeZoneMode = z.enum(['mine', 'venue']);
export type TimeZoneMode = z.infer<typeof TimeZoneMode>;

export const ClockMode = z.enum(['24h', '12h']);
export type ClockMode = z.infer<typeof ClockMode>;

export const HeightUnit = z.enum(HEIGHT_UNITS);
export type HeightUnit = z.infer<typeof HeightUnit>;

const SettingsData = z.object({
  timeZone: TimeZoneMode.catch('mine'),
  clock: ClockMode.catch('24h'),
  height: HeightUnit.catch('cm'),
  showBlocked: z.boolean().catch(true),
});
export type SettingsData = z.infer<typeof SettingsData>;

interface SettingsState extends SettingsData {
  set: (patch: Partial<SettingsData>) => void;
  reset: () => void;
}

const DEFAULTS: SettingsData = SettingsData.parse({});

const parseData = (raw: unknown): SettingsData => {
  const parsed = SettingsData.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULTS;
};

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
      partialize: ({ timeZone, clock, height, showBlocked }): SettingsData => ({
        timeZone,
        clock,
        height,
        showBlocked,
      }),
      migrate: () => DEFAULTS,
      merge: (persisted, current) => ({ ...current, ...parseData(persisted) }),
    },
  ),
);

const SETTING_KEYS = Object.keys(DEFAULTS) as (keyof SettingsData)[];

export const useHeightUnit = () => useSettings((s) => s.height);

export const useShowBlocked = () => useSettings((s) => s.showBlocked);

export const useSettingsChanged = () => useSettings((s) => SETTING_KEYS.some((k) => s[k] !== DEFAULTS[k]));
