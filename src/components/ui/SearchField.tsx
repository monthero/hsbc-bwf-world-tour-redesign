import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import type { FC, InputHTMLAttributes } from 'react';

import { IconClose, IconSearch } from './icons';

import classes from './SearchField.module.css';

export const SearchField: FC<
  Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'className'> & {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
> = ({ value, onChange, placeholder, size = 'md', className, ...rest }) => {
  const { t } = useLingui();
  return (
    <label className={clsx(classes.search, className)} data-size={size}>
      <IconSearch size={size === 'sm' ? 13 : 15} />
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t`Search player or country`}
      />
      {value && (
        <button type="button" className={classes.searchClear} aria-label={t`Clear search`} onClick={() => onChange('')}>
          <IconClose size={12} />
        </button>
      )}
    </label>
  );
};
