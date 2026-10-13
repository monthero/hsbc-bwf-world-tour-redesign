import { Button } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { formatNumber } from '~/utils/format';

import classes from './SelectionBar.module.css';
import utils from '~/styles/utils.module.css';

export const SelectionBar = memo<{
  count: number;
  filtered: number;
  allFiltered: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onBulk: () => void;
}>(({ count, filtered, allFiltered, onSelectAll, onClear, onBulk }) => (
  <div className={classes.bar} data-active={count > 0 || undefined}>
    <span className={clsx(utils.num, classes.count)}>
      {count ? `${formatNumber(count)} selected` : 'None selected'}
    </span>
    {!allFiltered && filtered > 0 && (
      <button type="button" className={classes.link} onClick={onSelectAll}>
        Select all {formatNumber(filtered)} filtered
      </button>
    )}
    {count > 0 && (
      <>
        <button type="button" className={classes.link} onClick={onClear}>
          Clear
        </button>
        <Button size="xs" radius="xl" onClick={onBulk} className={classes.bulk}>
          Bulk edit
        </Button>
      </>
    )}
  </div>
));
