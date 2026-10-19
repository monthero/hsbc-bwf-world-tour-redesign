import { Menu, type MenuProps } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import type { ReactElement } from 'react';

import { useIsMobile } from '~/hooks/useIsMobile';

import { BottomSheet } from './BottomSheet';
import { IconCheck } from './icons';

import classes from './OptionMenu.module.css';
import sheet from './Sheet.module.css';
import utils from '~/styles/utils.module.css';

export interface PickOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface PickProps<T extends string> {
  options: readonly PickOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const MENU_CLASSES = { dropdown: clsx(utils.popover, classes.menu), item: classes.item };

export const OptionMenu = <T extends string>({
  options,
  value,
  onChange,
  label,
  position = 'bottom-start',
  children,
}: PickProps<T> & { label?: string; position?: MenuProps['position']; children: ReactElement }) => (
  <Menu position={position} offset={6} classNames={MENU_CLASSES}>
    <Menu.Target>{children}</Menu.Target>
    <Menu.Dropdown aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Menu.Item
            key={o.value}
            data-active={on || undefined}
            aria-current={on || undefined}
            disabled={o.disabled && !on}
            rightSection={on ? <IconCheck size={13} /> : null}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Menu.Item>
        );
      })}
    </Menu.Dropdown>
  </Menu>
);

export const OptionList = <T extends string>({ options, value, onChange }: PickProps<T>) => (
  <div className={classes.list}>
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          className={clsx(classes.item, classes.row)}
          data-active={on || undefined}
          aria-pressed={on}
          disabled={o.disabled && !on}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {on && <IconCheck size={16} />}
        </button>
      );
    })}
  </div>
);

const OptionSheet = <T extends string>({
  opened,
  onClose,
  title,
  options,
  value,
  onChange,
}: PickProps<T> & { opened: boolean; onClose: () => void; title: string }) => {
  const pick = (v: T) => {
    onClose();
    onChange(v);
  };
  return (
    <BottomSheet opened={opened} onClose={onClose} handle bodyClassName={sheet.body}>
      <span className={sheet.title}>{title}</span>
      <OptionList options={options} value={value} onChange={pick} />
    </BottomSheet>
  );
};

export interface SheetTriggerProps {
  'aria-haspopup': 'dialog';
  'aria-expanded': boolean;
  onClick: () => void;
}

export const OptionPicker = <T extends string>({
  title,
  position,
  renderTrigger,
  ...pick
}: PickProps<T> & {
  title: string;
  position?: MenuProps['position'];
  renderTrigger: (sheet?: SheetTriggerProps) => ReactElement;
}) => {
  const mobile = useIsMobile();
  const [opened, { open, close }] = useDisclosure(false);
  if (!mobile)
    return (
      <OptionMenu {...pick} label={title} position={position}>
        {renderTrigger()}
      </OptionMenu>
    );
  return (
    <>
      {renderTrigger({ 'aria-haspopup': 'dialog', 'aria-expanded': opened, onClick: open })}
      <OptionSheet {...pick} opened={opened} onClose={close} title={title} />
    </>
  );
};
