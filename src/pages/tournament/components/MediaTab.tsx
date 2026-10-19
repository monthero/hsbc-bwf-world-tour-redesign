import { t } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Loader } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { VideoCard } from '~/components/media';
import {
  CondensedBar,
  EmptyState,
  FilterChip,
  FilterField,
  FilterSheet,
  IconExpand,
  LiveDot,
  OptionPicker,
  SectionTitle,
  type PickOption,
  type SheetTriggerProps,
} from '~/components/ui';
import { useScrolledPast } from '~/hooks/useScrolledPast';
import { useTournamentMedia } from '~/hooks/useTournamentMedia';
import type { Match } from '~/types';
import { roundName } from '~/utils/matches';
import { regionHiddenNote } from '~/utils/media';

import type { TabProps } from '../types';
import { ClearButton, FilterSearch } from './matches/FilterControls';
import {
  buildMediaSections,
  mediaMatchesQuery,
  mediaRound,
  mediaRounds,
  mediaType,
  mediaTypes,
  TYPE_LABELS,
  type MediaSection,
} from './media/sections';

import page from '../TournamentPage.module.css';
import classes from './MediaTab.module.css';
import utils from '~/styles/utils.module.css';

const ALL = 'all';
const LIVE_SECTION = 'live';
const LIVE_ICON = <LiveDot pulse size={8} />;

type SelectSize = 'md' | 'sm';

const SectionBlock = memo<{
  section: MediaSection;
  matchOf: ReadonlyMap<string, Match>;
  eventName: string;
  timeZone: string | null;
}>(({ section, matchOf, eventName, timeZone }) => {
  return (
    <section className={classes.section}>
      <SectionTitle count={section.count} icon={section.key === LIVE_SECTION ? LIVE_ICON : undefined}>
        {section.title}
      </SectionTitle>
      {section.groups.map((g) => (
        <div key={g.key} className={classes.group}>
          {g.label && <h3 className={classes.groupLabel}>{g.label}</h3>}
          <div className={classes.grid}>
            {g.items.map((item) => (
              <VideoCard
                key={item.id}
                item={item}
                match={matchOf.get(item.id)}
                eventName={eventName}
                timeZone={timeZone}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
});

interface PickerProps {
  title: string;
  options: PickOption<string>[];
  value: string;
  onChange: (value: string) => void;
}

const FilterSelect = memo<PickerProps & { size: SelectSize }>(({ title, options, value, onChange, size }) => {
  const { t: tr } = useLingui();
  const current = options.find((o) => o.value === value)?.label ?? '';
  const label = tr({
    message: `${title}: ${current}`,
    comment: 'Screen-reader label of a filter dropdown, e.g. “Round: Final”',
  });
  return (
    <OptionPicker
      options={options}
      value={value}
      onChange={onChange}
      title={title}
      renderTrigger={(sheet?: SheetTriggerProps) => (
        <button type="button" className={classes.select} data-size={size} aria-label={label} {...sheet}>
          <span className={classes.selectLabel}>{current}</span>
          <IconExpand size={size === 'sm' ? 12 : 14} />
        </button>
      )}
    />
  );
});

const OptionChips = memo<Omit<PickerProps, 'title'>>(({ options, value, onChange }) => (
  <div className={classes.chips}>
    {options.map((o) => {
      const on = o.value === value;
      return (
        <FilterChip key={o.value} size="lg" active={on} disabled={o.disabled && !on} onClick={() => onChange(o.value)}>
          {o.label}
        </FilterChip>
      );
    })}
  </div>
));

interface FilterModel {
  rounds: PickerProps | null;
  types: PickerProps | null;
}

const Selects: FC<FilterModel & { size: SelectSize }> = ({ rounds, types, size }) => (
  <div className={classes.selects} data-size={size}>
    {types && <FilterSelect {...types} size={size} />}
    {rounds && <FilterSelect {...rounds} size={size} />}
  </div>
);

const tabMessage = (enabled: boolean, isError: boolean, hidden: number) => {
  if (hidden) return regionHiddenNote(hidden);
  if (!enabled)
    return t({
      message: 'Videos appear on BWF TV once the tournament starts.',
      comment: 'Videos tab empty state before play starts. BWF TV is BWF’s YouTube channel',
    });
  return isError
    ? t({ message: 'Couldn’t load videos from YouTube right now.', comment: 'Videos tab error message' })
    : t({
        message: 'No videos on BWF TV for this tournament yet.',
        comment: 'Videos tab empty state. BWF TV is BWF’s YouTube channel',
      });
};

export const MediaTab: FC<TabProps> = ({ tournament }) => {
  const { t: tr, i18n } = useLingui();
  const { items, matchOf, isLoading, isError, enabled, hidden } = useTournamentMedia(tournament);
  const [filtersRef, filtersOut] = useScrolledPast<HTMLDivElement>();
  const [q, setQ] = useState('');
  const [stagePick, setStagePick] = useState(ALL);
  const [typePick, setTypePick] = useState(ALL);
  const rounds = useMemo(() => mediaRounds(items, matchOf), [items, matchOf]);
  const types = useMemo(() => mediaTypes(items), [items]);
  const stage = rounds.includes(stagePick) ? stagePick : ALL;
  const activeType = types.find((v) => v === typePick);
  const type = activeType ?? ALL;
  const searched = useMemo(() => items.filter((i) => mediaMatchesQuery(i, matchOf, q)), [items, matchOf, q]);
  const typed = useMemo(
    () => (activeType ? searched.filter((i) => mediaType(i) === activeType) : searched),
    [activeType, searched],
  );
  const staged = useMemo(
    () => (stage === ALL ? searched : searched.filter((i) => mediaRound(i, matchOf) === stage)),
    [stage, searched, matchOf],
  );
  const byStage = useMemo(() => Map.groupBy(typed, (i) => mediaRound(i, matchOf)), [typed, matchOf]);
  const typesIn = useMemo(() => new Set(staged.map((i) => mediaType(i))), [staged]);
  const roundPicker = useMemo(
    (): PickerProps | null =>
      rounds.length
        ? {
            title: tr({ message: 'Round', comment: 'Videos tab: title of the round filter menu and sheet' }),
            value: stage,
            onChange: setStagePick,
            options: [
              {
                value: ALL,
                label: tr({ message: 'All rounds', comment: 'Videos tab round filter: videos from every round' }),
                disabled: !typed.length,
              },
              ...rounds.map((r) => ({ value: r, label: roundName(r), disabled: !byStage.has(r) })),
            ],
          }
        : null,
    [tr, rounds, stage, typed, byStage],
  );
  const typePicker = useMemo(
    (): PickerProps | null =>
      types.length > 1
        ? {
            title: tr({ message: 'Video type', comment: 'Videos tab: title of the video type filter menu and sheet' }),
            value: type,
            onChange: setTypePick,
            options: [
              {
                value: ALL,
                label: tr({ message: 'All videos', comment: 'Videos tab type filter: every kind of video' }),
                disabled: !staged.length,
              },
              ...types.map((v) => ({ value: v, label: i18n._(TYPE_LABELS[v]), disabled: !typesIn.has(v) })),
            ],
          }
        : null,
    [tr, i18n, types, type, staged, typesIn],
  );
  const visible = useMemo(() => (stage === ALL ? typed : (byStage.get(stage) ?? [])), [stage, byStage, typed]);
  const sections = useMemo(() => buildMediaSections(visible, matchOf, tournament), [visible, matchOf, tournament]);
  const clear = useCallback(() => {
    setStagePick(ALL);
    setTypePick(ALL);
    setQ('');
  }, []);
  const count = Number(stage !== ALL) + Number(type !== ALL) + Number(!!q.trim());
  const summary =
    stage !== ALL || activeType ? (
      <>
        {activeType && <span>{i18n._(TYPE_LABELS[activeType])}</span>}
        {stage !== ALL && <span>{roundName(stage)}</span>}
      </>
    ) : undefined;
  const hasItems = items.length > 0;
  return (
    <div className={classes.root}>
      {hasItems && (
        <CondensedBar visible={filtersOut}>
          <Selects rounds={roundPicker} types={typePicker} size="sm" />
          <FilterSearch variant="compact" value={q} onChange={setQ} />
        </CondensedBar>
      )}
      <div className={clsx(utils.container, page.tabSection, classes.tab)}>
        {isLoading && (
          <div className={classes.loading}>
            <Loader size="sm" />
          </div>
        )}
        {!isLoading && !hasItems && <EmptyState>{tabMessage(enabled, isError, hidden)}</EmptyState>}
        {hasItems && (
          <div ref={filtersRef} className={classes.filters}>
            <Selects rounds={roundPicker} types={typePicker} size="md" />
            <div className={classes.searchWrap}>
              <FilterSearch variant="inline" value={q} onChange={setQ} />
            </div>
          </div>
        )}
        {hasItems && !sections.length && (
          <EmptyState>
            <Trans comment="Videos tab empty state when the round or type filter or search hides every video">
              No videos match these filters.
            </Trans>
          </EmptyState>
        )}
        {sections.map((s) => (
          <SectionBlock
            key={s.key}
            section={s}
            matchOf={matchOf}
            eventName={tournament.name}
            timeZone={tournament.timeZone}
          />
        ))}
      </div>
      {hasItems && (
        <FilterSheet
          visible={filtersOut}
          count={count}
          summary={summary}
          clear={count > 0 && <ClearButton variant="sheet" onClick={clear} />}
        >
          {typePicker && (
            <FilterField label={typePicker.title}>
              <OptionChips options={typePicker.options} value={type} onChange={setTypePick} />
            </FilterField>
          )}
          {roundPicker && (
            <FilterField label={roundPicker.title}>
              <OptionChips options={roundPicker.options} value={stage} onChange={setStagePick} />
            </FilterField>
          )}
          <FilterSearch variant="sheet" value={q} onChange={setQ} />
        </FilterSheet>
      )}
    </div>
  );
};
