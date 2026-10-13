import { useCallback } from 'react';
import { create } from 'zustand';

interface SectionsState {
  open: Partial<Record<string, boolean>>;
  setOpen: (key: string, open: boolean) => void;
}

const useSectionsStore = create<SectionsState>()((set) => ({
  open: {},
  setOpen: (key, open) => set((s) => ({ open: { ...s.open, [key]: open } })),
}));

export const useSectionOpen = (key: string, fallback: boolean) => {
  const open = useSectionsStore((s) => s.open[key]) ?? fallback;
  const setOpen = useSectionsStore((s) => s.setOpen);
  const toggle = useCallback(() => setOpen(key, !open), [setOpen, key, open]);
  return [open, toggle] as const;
};
