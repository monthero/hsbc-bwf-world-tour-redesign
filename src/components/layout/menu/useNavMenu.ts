import { useFocusTrap, useMergedRef } from '@mantine/hooks';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useMenuLocation } from './location';

export interface NavMenu {
  open: boolean;
  modal: boolean;
  id: string;
  triggerId: string;
  trap: (node: HTMLElement | null) => void;
  toggle: () => void;
  close: () => void;
  dismiss: () => void;
}

export const useNavMenu = (defaultOpen = false): NavMenu => {
  const { key } = useMenuLocation();
  const [openAt, setOpenAt] = useState<string | null>(defaultOpen ? key : null);
  const [engaged, setEngaged] = useState(false);
  const [scope, setScope] = useState<HTMLElement | null>(null);
  const open = openAt === key;
  const modal = open && engaged;
  const id = useId();
  const triggerId = `${id}-trigger`;
  const trap = useMergedRef(useFocusTrap(modal), setScope);

  const toggle = useCallback(() => {
    setEngaged(true);
    setOpenAt((at) => (at === key ? null : key));
  }, [key]);
  const close = useCallback(() => setOpenAt(null), []);
  const dismiss = useCallback(() => {
    setOpenAt(null);
    document.getElementById(triggerId)?.focus();
  }, [triggerId]);

  useEffect(() => {
    if (!open || !scope) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && e.target instanceof Node && scope.contains(e.target)) dismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, scope, dismiss]);

  return useMemo(
    () => ({ open, modal, id, triggerId, trap, toggle, close, dismiss }),
    [open, modal, id, triggerId, trap, toggle, close, dismiss],
  );
};
