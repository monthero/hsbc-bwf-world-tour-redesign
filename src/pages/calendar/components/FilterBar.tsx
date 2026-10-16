import { clsx } from 'clsx';
import { memo, type Ref } from 'react';

import { Level } from '~/api/schemas';
import { FilterChip, IconLive, Segmented, StickyBar } from '~/components/ui';
import { LEVEL_META } from '~/constants';
import { useLazyOptions } from '~/i18n/useLazyOptions';

import { STATUS_OPTIONS } from '../constants';
import type { StatusFilter } from '../types';

import classes from './FilterBar.module.css';
import utils from '~/styles/utils.module.css';

export const FilterBar = memo<{
  ref: Ref<HTMLDivElement>;
  compact: boolean;
  levels: Level[] | undefined;
  status: StatusFilter;
  showStatus: boolean;
  onLevel: (level: Level) => void;
  onStatus: (status: StatusFilter | null) => void;
  jumpLabel: string | null;
  onJump: () => void;
  isMobile: boolean;
}>(({ ref, compact, levels, status, showStatus, onLevel, onStatus, jumpLabel, onJump, isMobile }) => {
  const statusOptions = useLazyOptions(STATUS_OPTIONS);
  return (
    <StickyBar ref={ref} glass zIndex={5} top={compact ? 'var(--cal-compact-h)' : 0} className={classes.bar}>
      <div className={clsx(utils.container, classes.inner)}>
        <div className={clsx(utils.noScrollbar, classes.chips)}>
          {Level.options.map((l) => (
            <FilterChip
              key={l}
              className={classes.chip}
              tone={LEVEL_META[l]}
              dot
              active={!!levels?.includes(l)}
              onClick={() => onLevel(l)}
            >
              {LEVEL_META[l].label}
            </FilterChip>
          ))}
        </div>
        {showStatus && (
          <div className={classes.status}>
            <Segmented options={statusOptions} value={status} onChange={onStatus} height={isMobile ? 32 : 30} />
          </div>
        )}
        {jumpLabel && (
          <button type="button" className={classes.jump} onClick={onJump}>
            <IconLive size={15} />
            {jumpLabel}
          </button>
        )}
      </div>
    </StickyBar>
  );
});
