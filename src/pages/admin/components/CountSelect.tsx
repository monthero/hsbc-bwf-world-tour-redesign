import { Select, type ComboboxItem, type SelectProps } from '@mantine/core'
import { clsx } from 'clsx'
import { memo, useCallback, useMemo, type ReactNode } from 'react'

import type { CountOption } from '../filters'

import classes from './CountSelect.module.css'
import utils from '~/styles/utils.module.css'

const SELECT_CLASSES = {
  root: classes.root,
  input: classes.input,
  dropdown: clsx(utils.popover, classes.dropdown),
  option: classes.option,
}

const COMBOBOX_PROPS = { offset: 6, width: 260, position: 'bottom-start' } as const

export const CountSelect = memo<{
  data: readonly CountOption[]
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder: string
  label: string
  icon?: (value: string) => ReactNode
}>(({ data, value, onChange, placeholder, label, icon }) => {
  const counts = useMemo(() => new Map(data.map((c) => [c.value, c.count])), [data])
  const renderOption = useCallback<NonNullable<SelectProps['renderOption']>>(
    ({ option }: { option: ComboboxItem }) => (
      <>
        {icon?.(option.value)}
        <span className={utils.ellipsis}>{option.label}</span>
        <span className={clsx(utils.num, classes.count)}>{counts.get(option.value)}</span>
      </>
    ),
    [counts, icon],
  )
  const onSelect = useCallback((v: string | null) => onChange(v ?? undefined), [onChange])
  return (
    <Select
      data={data as CountOption[]}
      value={value ?? null}
      onChange={onSelect}
      renderOption={renderOption}
      leftSection={value ? icon?.(value) : null}
      placeholder={placeholder}
      aria-label={label}
      searchable
      clearable
      nothingFoundMessage="No match"
      maxDropdownHeight={320}
      comboboxProps={COMBOBOX_PROPS}
      classNames={SELECT_CLASSES}
    />
  )
})
