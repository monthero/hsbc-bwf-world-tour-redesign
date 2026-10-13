import { clsx } from 'clsx'
import type { FC, InputHTMLAttributes } from 'react'

import { IconClose, IconSearch } from './icons'

import classes from './SearchField.module.css'

export const SearchField: FC<
  Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'className'> & {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
  }
> = ({ value, onChange, placeholder = 'Search player or country', size = 'md', className, ...rest }) => {
  return (
    <label className={clsx(classes.search, className)} data-size={size}>
      <IconSearch size={size === 'sm' ? 13 : 15} />
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <button type="button" className={classes.searchClear} aria-label="Clear search" onClick={() => onChange('')}>
          <IconClose size={12} />
        </button>
      )}
    </label>
  )
}
