import { memo, type ReactNode } from 'react';

import { FilterChip } from '~/components/ui';
import { LEVEL_META } from '~/constants';
import type { Level } from '~/types';

import { LEGEND_LEVELS, STATUS_META } from '../constants';
import { SeasonStatus } from '../types';
import { SpotHalo } from './SpotHalo';

import classes from './SeasonLegend.module.css';

const MARKERS = {
  live: { next: <SpotHalo live solid className={classes.marker} /> },
  next: { next: <SpotHalo live={false} solid className={classes.marker} /> },
};

const LegendGroup = <T extends string>({
  label,
  options,
  meta,
  picked,
  markers,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  meta: Record<T, { label: string; color: string }>;
  picked: readonly T[] | undefined;
  markers?: Partial<Record<T, ReactNode>>;
  onToggle: (id: T) => void;
}) => (
  <fieldset aria-label={label} className={classes.row} data-picking={picked?.length ? true : undefined}>
    {options.map((id) => (
      <FilterChip
        key={id}
        size="sm"
        dot={!markers?.[id]}
        tone={meta[id]}
        active={!!picked?.includes(id)}
        className={classes.item}
        data-key={id}
        onClick={() => onToggle(id)}
      >
        {markers?.[id]}
        {meta[id].label}
      </FilterChip>
    ))}
  </fieldset>
);

export const SeasonLegend = memo<{
  compact: boolean;
  live: boolean;
  levels: Level[] | undefined;
  status: SeasonStatus[] | undefined;
  onLevel: (level: Level) => void;
  onStatus: (status: SeasonStatus) => void;
}>(({ compact, live, levels, status, onLevel, onStatus }) => (
  <div className={classes.legend} data-compact={compact || undefined}>
    <LegendGroup label="Levels" options={LEGEND_LEVELS} meta={LEVEL_META} picked={levels} onToggle={onLevel} />
    <LegendGroup
      label="Status"
      options={SeasonStatus.options}
      meta={STATUS_META}
      picked={status}
      markers={live ? MARKERS.live : MARKERS.next}
      onToggle={onStatus}
    />
  </div>
));
