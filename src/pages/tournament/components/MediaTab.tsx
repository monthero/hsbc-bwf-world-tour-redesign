import { t } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Loader } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { VideoCard } from '~/components/media';
import { EmptyState, LiveDot, SectionTitle, Segmented, type SegmentedOption } from '~/components/ui';
import { useTournamentMedia } from '~/hooks/useTournamentMedia';
import type { Match } from '~/types';
import { roundName } from '~/utils/matches';
import { regionHiddenNote } from '~/utils/media';

import type { TabProps } from '../types';
import { FilterSearch } from './matches/FilterControls';
import { buildMediaSections, mediaMatchesQuery, mediaRound, mediaRounds, type MediaSection } from './media/sections';

import page from '../TournamentPage.module.css';
import classes from './MediaTab.module.css';
import utils from '~/styles/utils.module.css';

const ALL = 'all';
const LIVE_SECTION = 'live';
const LIVE_ICON = <LiveDot pulse size={8} />;

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

const tabMessage = (enabled: boolean, isError: boolean, hidden: number) => {
  if (hidden) return regionHiddenNote(hidden);
  if (!enabled)
    return t({
      message: 'Videos appear on BWF TV once the tournament starts.',
      comment: 'Media tab empty state before play starts. BWF TV is BWF’s YouTube channel',
    });
  return isError
    ? t({ message: 'Couldn’t load videos from YouTube right now.', comment: 'Media tab error message' })
    : t({
        message: 'No videos on BWF TV for this tournament yet.',
        comment: 'Media tab empty state. BWF TV is BWF’s YouTube channel',
      });
};

export const MediaTab: FC<TabProps> = ({ tournament }) => {
  const { t: tr } = useLingui();
  const { items, matchOf, isLoading, isError, enabled, hidden } = useTournamentMedia(tournament);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState(ALL);
  const rounds = useMemo(() => mediaRounds(items, matchOf), [items, matchOf]);
  const searched = useMemo(() => items.filter((i) => mediaMatchesQuery(i, matchOf, q)), [items, matchOf, q]);
  const byStage = useMemo(() => Map.groupBy(searched, (i) => mediaRound(i, matchOf)), [searched, matchOf]);
  const options = useMemo(
    (): SegmentedOption<string>[] => [
      {
        value: ALL,
        label: tr({ message: 'All', context: 'round', comment: 'Media tab round filter: videos from every round' }),
        disabled: !searched.length,
      },
      ...rounds.map((r) => ({ value: r, label: roundName(r), disabled: !byStage.has(r) })),
    ],
    [tr, rounds, searched, byStage],
  );
  const visible = useMemo(() => (stage === ALL ? searched : (byStage.get(stage) ?? [])), [stage, byStage, searched]);
  const sections = useMemo(() => buildMediaSections(visible, matchOf, tournament), [visible, matchOf, tournament]);
  const selectStage = useCallback((v: string | null) => setStage(v ?? ALL), []);
  return (
    <div className={clsx(utils.container, page.tabSection, classes.tab)}>
      {isLoading && (
        <div className={classes.loading}>
          <Loader size="sm" />
        </div>
      )}
      {!isLoading && !items.length && <EmptyState>{tabMessage(enabled, isError, hidden)}</EmptyState>}
      {items.length > 0 && (
        <div className={classes.filters}>
          {rounds.length > 0 && (
            <div className={clsx(utils.noScrollbar, classes.stages)}>
              <Segmented className={classes.stageSeg} options={options} value={stage} onChange={selectStage} />
            </div>
          )}
          <div className={classes.searchWrap}>
            <FilterSearch variant="inline" value={q} onChange={setQ} />
          </div>
        </div>
      )}
      {items.length > 0 && !sections.length && (
        <EmptyState>
          <Trans comment="Media tab empty state when the round filter or search hides every video">
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
  );
};
