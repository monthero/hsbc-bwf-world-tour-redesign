import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { LOCALES, type Locale } from '~/i18n/locales';

import { mergeParsed, safeJSONStorage } from './persistence';

const STORAGE_KEY = 'bwf-locale';

const LocaleData = z.object({
  chosen: z.enum(LOCALES).nullable().catch(null),
  newsNoticeDismissed: z.boolean().catch(false),
});
type LocaleData = z.infer<typeof LocaleData>;

interface LocaleState extends LocaleData {
  choose: (locale: Locale) => void;
  dismissNewsNotice: () => void;
}

const DEFAULTS: LocaleData = LocaleData.parse({});

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      choose: (chosen) => set({ chosen }),
      dismissNewsNotice: () => set({ newsNoticeDismissed: true }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<LocaleData>(),
      partialize: ({ chosen, newsNoticeDismissed }): LocaleData => ({ chosen, newsNoticeDismissed }),
      migrate: () => DEFAULTS,
      merge: mergeParsed(LocaleData, () => DEFAULTS),
    },
  ),
);
