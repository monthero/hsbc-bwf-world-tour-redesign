import { Trans, useLingui } from '@lingui/react/macro';
import { useDisclosure } from '@mantine/hooks';
import type { FC, ReactNode } from 'react';

import { BottomSheet } from './BottomSheet';
import { FloatingPill } from './FloatingPill';
import { IconFilters } from './icons';

import classes from './FilterSheet.module.css';
import sheet from './Sheet.module.css';

export const FilterField: FC<{ label: ReactNode; children: ReactNode }> = ({ label, children }) => (
  <div className={classes.field}>
    <span className={classes.label}>{label}</span>
    {children}
  </div>
);

export const FilterSheet: FC<{
  visible: boolean;
  count: number;
  summary?: ReactNode;
  clear?: ReactNode;
  children: ReactNode;
}> = ({ visible, count, summary, clear, children }) => {
  const { t } = useLingui();
  const [open, { open: show, close }] = useDisclosure(false);
  const title = t({ message: 'Filters', comment: 'Button and sheet title for the filters on phones' });
  return (
    <>
      <FloatingPill visible={visible && !open} onClick={show} label={title} mobileOnly>
        <IconFilters size={16} />
        {summary === undefined ? <span>{title}</span> : summary}
        {count > 0 && <span className={classes.pillCount}>{count}</span>}
      </FloatingPill>
      <BottomSheet opened={open} onClose={close} handle bodyClassName={sheet.body}>
        <div className={sheet.head}>
          <span className={sheet.title}>{title}</span>
          {clear}
        </div>
        {children}
        <button type="button" className={classes.done} onClick={close}>
          <Trans comment="Button that closes the filters sheet">Done</Trans>
        </button>
      </BottomSheet>
    </>
  );
};
