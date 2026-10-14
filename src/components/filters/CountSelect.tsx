import { Select, type ComboboxItem, type SelectProps } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type CSSProperties } from 'react';

import { Flag } from '~/components/country';
import type { CountOption } from '~/utils/filter';

import classes from './CountSelect.module.css';
import utils from '~/styles/utils.module.css';

const SELECT_CLASSES = {
  root: classes.root,
  input: classes.input,
  section: classes.section,
  dropdown: clsx(utils.popover, classes.dropdown),
  option: classes.option,
};

const DROPDOWN_WIDTH = 260;

const flagOf = (cc: string) => <Flag cc={cc} size="sm" tip={false} />;

export const CountSelect = memo<{
  data: readonly CountOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  label: string;
  nothingFound: string;
  width: number;
  align: 'start' | 'end';
  flags?: boolean;
}>(({ data, value, onChange, placeholder, label, nothingFound, width, align, flags }) => {
  const counts = useMemo(() => new Map(data.map((c) => [c.value, c.count])), [data]);
  const style = useMemo(() => ({ '--count-select-w': `${width}px` }) as CSSProperties, [width]);
  const combobox = useMemo(() => ({ offset: 6, width: DROPDOWN_WIDTH, position: `bottom-${align}` }) as const, [align]);
  const renderOption = useCallback<NonNullable<SelectProps['renderOption']>>(
    ({ option }: { option: ComboboxItem }) => (
      <>
        {flags && flagOf(option.value)}
        <span className={utils.ellipsis}>{option.label}</span>
        <span className={clsx(utils.num, classes.count)}>{counts.get(option.value)}</span>
      </>
    ),
    [counts, flags],
  );
  const onSelect = useCallback((v: string | null) => onChange(v ?? undefined), [onChange]);
  return (
    <Select
      data={data as CountOption[]}
      value={value ?? null}
      onChange={onSelect}
      renderOption={renderOption}
      leftSection={flags && value ? flagOf(value) : null}
      placeholder={placeholder}
      aria-label={label}
      searchable
      clearable
      nothingFoundMessage={nothingFound}
      maxDropdownHeight={320}
      comboboxProps={combobox}
      classNames={SELECT_CLASSES}
      style={style}
    />
  );
});
