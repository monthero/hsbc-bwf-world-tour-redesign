import { Collapse } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useId, useMemo, useRef, type ReactNode } from 'react';

import { SectionTitle } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useSectionOpen } from '~/stores/sections';
import { keepTopInView } from '~/utils/layout';

import classes from './CollapsibleSection.module.css';
import utils from '~/styles/utils.module.css';

export const CollapsibleSection = memo<{
  storeKey: string;
  title: ReactNode;
  count?: ReactNode;
  aside?: ReactNode;
  defaultOpen: boolean;
  children: ReactNode;
}>(({ storeKey, title, count, aside, defaultOpen, children }) => {
  const mobile = useIsMobile();
  const [open, toggle] = useSectionOpen(storeKey, defaultOpen);
  const ref = useRef<HTMLElement>(null);
  const bodyId = useId();

  const onToggle = useCallback(() => {
    if (open && ref.current) keepTopInView(ref.current);
    toggle();
  }, [open, toggle]);

  const sectionToggle = useMemo(
    () => (mobile ? { open, onToggle, controls: bodyId } : undefined),
    [mobile, open, onToggle, bodyId],
  );

  return (
    <section ref={ref} className={classes.root}>
      <div className={clsx(classes.head, mobile && utils.glass)}>
        <SectionTitle as="h3" count={count} aside={aside} toggle={sectionToggle}>
          {title}
        </SectionTitle>
      </div>
      <Collapse id={bodyId} expanded={!mobile || open}>
        <div className={classes.body}>{children}</div>
      </Collapse>
    </section>
  );
});
