import { Modal } from '@mantine/core';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { IconButton, IconClose } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';

import classes from './AdminModal.module.css';
import utils from '~/styles/utils.module.css';

const MODAL_CLASSES = { content: clsx(utils.popover, classes.content), body: classes.body };
const DESKTOP_TRANSITION = { transition: 'pop', duration: 180 } as const;
const MOBILE_TRANSITION = { transition: 'slide-up', duration: 240 } as const;

export const AdminModal: FC<{
  opened: boolean;
  onClose: () => void;
  onExited?: () => void;
  title: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  size?: number | string;
  children: ReactNode;
}> = ({ opened, onClose, onExited, title, actions, status, size = 860, children }) => {
  const mobile = useIsMobile();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      onExitTransitionEnd={onExited}
      centered
      fullScreen={mobile}
      size={size}
      padding={0}
      withCloseButton={false}
      transitionProps={mobile ? MOBILE_TRANSITION : DESKTOP_TRANSITION}
      classNames={MODAL_CLASSES}
    >
      <header className={classes.header}>
        <div className={classes.title}>{title}</div>
        {actions}
        <IconButton label="Close" variant="ghost" onClick={onClose}>
          <IconClose size={16} />
        </IconButton>
        {status && <div className={classes.status}>{status}</div>}
      </header>
      <div className={classes.scroll} tabIndex={-1} data-autofocus>
        {children}
      </div>
    </Modal>
  );
};
