import { useLingui } from '@lingui/react/macro';
import { memo, useMemo, type ReactNode } from 'react';

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
}>(({ compact, live, levels, status, onLevel, onStatus }) => {
  const { i18n, t } = useLingui();
  const statusMeta = useMemo(
    () =>
      Object.fromEntries(
        SeasonStatus.options.map((s) => [s, { label: i18n._(STATUS_META[s].label), color: STATUS_META[s].color }]),
      ) as Record<SeasonStatus, { label: string; color: string }>,
    [i18n],
  );
  return (
    <div className={classes.legend} data-compact={compact || undefined}>
      <LegendGroup
        label={t({
          message: 'Levels',
          comment:
            'Screen-reader label for the About page map filters by tournament level (Super 1000, 750, 500, 300, Finals)',
        })}
        options={LEGEND_LEVELS}
        meta={LEVEL_META}
        picked={levels}
        onToggle={onLevel}
      />
      <LegendGroup
        label={t({
          message: 'Status',
          comment:
            'Screen-reader label for the About page map filters by tournament status (completed, upcoming, live or next)',
        })}
        options={SeasonStatus.options}
        meta={statusMeta}
        picked={status}
        markers={live ? MARKERS.live : MARKERS.next}
        onToggle={onStatus}
      />
    </div>
  );
});
