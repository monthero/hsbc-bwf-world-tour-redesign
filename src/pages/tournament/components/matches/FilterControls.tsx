import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useCallback, useLayoutEffect, useMemo, useRef, type FC } from 'react';

import { FilterChip, LiveDot, SearchField, Segmented, StarButton, type SegmentedOption } from '~/components/ui';
import type { TournamentDay } from '~/types';
import { centerChild } from '~/utils/scroll';

import type { MatchFilters } from './useMatchFilters';
import type { CourtChipModel, EventChipModel } from './utils';

import classes from './FilterControls.module.css';
import utils from '~/styles/utils.module.css';

export type FilterVariant = 'inline' | 'compact' | 'sheet';

const SIZE = { compact: 'sm', inline: 'md', sheet: 'lg' } as const satisfies Record<FilterVariant, string>;

const STAR_SIZE: Record<FilterVariant, number> = { compact: 12, inline: 14, sheet: 15 };

const DAY_HEIGHT: Record<FilterVariant, number> = { compact: 28, inline: 32, sheet: 44 };

const SEARCH_CLASS: Record<FilterVariant, string | undefined> = {
  inline: classes.searchInline,
  compact: classes.searchCompact,
  sheet: classes.searchSheet,
};

const TODAY_BADGE = <LiveDot pulse size={4} />;

interface ChipsProps {
  variant: FilterVariant;
  className?: string;
}

export const EventChips = memo<ChipsProps & { chips: EventChipModel[]; onToggle: MatchFilters['toggleEvent'] }>(
  ({ chips, onToggle, variant, className }) => {
    return (
      <div className={clsx(utils.noScrollbar, classes.chips, className)} data-variant={variant}>
        {chips.map((c) => (
          <FilterChip
            key={c.code}
            event={c.code}
            size={SIZE[variant]}
            active={c.active}
            disabled={!c.count && !c.active}
            onClick={() => onToggle(c.code)}
          >
            {c.code}
          </FilterChip>
        ))}
      </div>
    );
  },
);

export const CourtChips = memo<ChipsProps & { chips: CourtChipModel[]; onToggle: MatchFilters['toggleCourt'] }>(
  ({ chips, onToggle, variant, className }) => {
    return (
      <div className={clsx(utils.noScrollbar, classes.chips, className)} data-variant={variant}>
        {chips.map(({ court, count, active, live }) => (
          <FilterChip
            key={court}
            size={SIZE[variant]}
            active={active}
            disabled={!count && !active}
            onClick={() => onToggle(court)}
          >
            <Trans comment="Match filter chip for one court of the venue, e.g. “Court 2”">Court {court}</Trans>
            {live && <LiveDot pulse size={6} />}
          </FilterChip>
        ))}
      </div>
    );
  },
);

export const FollowToggle = memo<{
  active: boolean;
  onToggle: () => void;
  variant: FilterVariant;
}>(({ active, onToggle, variant }) => {
  const { t } = useLingui();
  return (
    <StarButton
      variant="outline"
      box={SIZE[variant]}
      active={active}
      label={t({
        message: 'Show only players and countries you follow',
        comment: 'Star toggle in the match filters',
      })}
      size={STAR_SIZE[variant]}
      onClick={onToggle}
    />
  );
});

export const DaySegment = memo<{
  days: TournamentDay[];
  day: number;
  onChange: (day: number) => void;
  variant: FilterVariant;
}>(({ days, day, onChange, variant }) => {
  const options = useMemo(
    (): SegmentedOption<string>[] =>
      days
        .filter((d) => !d.isRest)
        .map((d) => ({
          value: String(d.index),
          label: d.shortLabel,
          badge: d.isLive ? TODAY_BADGE : undefined,
          muted: d.isPast,
        })),
    [days],
  );
  const select = useCallback((v: string | null) => v !== null && onChange(Number(v)), [onChange]);
  const lane = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = lane.current;
    const btn = el?.querySelectorAll<HTMLElement>('button')[options.findIndex((o) => o.value === String(day))];
    if (el && btn) centerChild(el, btn);
  }, [day, options]);
  return (
    <div ref={lane} className={clsx(utils.noScrollbar, classes.dayLane)} data-variant={variant}>
      <Segmented
        variant="solid"
        options={options}
        value={String(day)}
        onChange={select}
        height={DAY_HEIGHT[variant]}
        className={classes.days}
      />
    </div>
  );
});

export const ClearButton: FC<{ onClick: () => void; variant: FilterVariant }> = ({ onClick, variant }) => {
  return (
    <button type="button" className={classes.clear} data-variant={variant} onClick={onClick}>
      <Trans comment="Button that clears the event and court match filters">Clear</Trans>
    </button>
  );
};

export const FilterSearch: FC<{
  value: string;
  onChange: (v: string) => void;
  variant: FilterVariant;
}> = ({ value, onChange, variant }) => {
  const { t } = useLingui();
  return (
    <SearchField
      size={SIZE[variant]}
      className={SEARCH_CLASS[variant]}
      value={value}
      onChange={onChange}
      placeholder={
        variant === 'compact'
          ? t({ message: 'Search', comment: 'Short placeholder of the search field in the condensed filter bar' })
          : undefined
      }
    />
  );
};

export const Divider: FC<{ fade?: boolean; className?: string }> = ({ fade, className }) => {
  return <span className={clsx(classes.divider, className)} data-fade={fade || undefined} />;
};
