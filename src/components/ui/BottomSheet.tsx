import { Drawer } from '@mantine/core';
import type { CSSProperties, FC, ReactNode } from 'react';

import classes from './BottomSheet.module.css';

const OVERLAY = { backgroundOpacity: 0.62, blur: 4 };

export const BottomSheet: FC<{
  opened: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
  handle?: boolean;
  bodyClassName?: string;
  onExited?: () => void;
}> = ({ opened, onClose, children, maxHeight = '88dvh', handle, bodyClassName, onExited }) => {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      onExitTransitionEnd={onExited}
      position="bottom"
      withCloseButton={false}
      padding={0}
      overlayProps={OVERLAY}
      classNames={{ content: classes.sheet, body: bodyClassName ?? classes.body }}
      style={{ '--sheet-max-h': maxHeight } as CSSProperties}
    >
      {handle && <span className={classes.handle} />}
      {children}
    </Drawer>
  );
};
