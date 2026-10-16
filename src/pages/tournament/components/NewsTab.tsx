import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type FC } from 'react';

import { useTournamentNews } from '~/api/news';
import type { NewsItem } from '~/api/schemas';
import { NewsGrid } from '~/components/news';
import { EmptyState, RetryState, SectionTitle } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Tournament } from '~/types';
import { date } from '~/utils/dates';
import { toStory, type NewsStory, type TournamentLookup } from '~/utils/news';

import type { TabProps } from '../types';

import page from '../TournamentPage.module.css';
import classes from './NewsTab.module.css';
import utils from '~/styles/utils.module.css';

type Phase = 'after' | 'during' | 'preview';

const PHASES: readonly { key: Phase; title: MessageDescriptor }[] = [
  {
    key: 'after',
    title: msg({
      message: 'After the event',
      comment: 'News tab section: stories published after the tournament ended',
    }),
  },
  {
    key: 'during',
    title: msg({
      message: 'During the event',
      comment: 'News tab section: stories published while the tournament ran',
    }),
  },
  {
    key: 'preview',
    title: msg({ message: 'Preview', comment: 'News tab section: stories published before the tournament started' }),
  },
];

const SKELETON_COUNT = { card: 3, row: 4 } as const;

type Variant = keyof typeof SKELETON_COUNT;

const NO_TOURNAMENTS = new Map<never, never>();

interface NewsPhase {
  key: Phase;
  title: MessageDescriptor;
  stories: NewsStory[];
}

const phaseOf = (item: NewsItem, t: Tournament): Phase => {
  const day = date(item.publishedAt);
  if (day.isBefore(date(t.start), 'day')) return 'preview';
  return day.isAfter(date(t.end), 'day') ? 'after' : 'during';
};

const buildPhases = (items: readonly NewsItem[], t: Tournament): NewsPhase[] => {
  const lookup: TournamentLookup = { byCode: new Map([[t.code, t]]), byName: NO_TOURNAMENTS, byYear: NO_TOURNAMENTS };
  const byPhase = Map.groupBy(items, (i) => phaseOf(i, t));
  return PHASES.flatMap(({ key, title }) => {
    const own = byPhase.get(key);
    return own ? [{ key, title, stories: own.map((i) => ({ ...toStory(i, lookup), tournament: null })) }] : [];
  });
};

const PhaseSection = memo<{ phase: NewsPhase; variant: Variant }>(({ phase, variant }) => {
  const { i18n } = useLingui();
  return (
    <section className={classes.section}>
      <SectionTitle count={phase.stories.length}>{i18n._(phase.title)}</SectionTitle>
      <NewsGrid stories={phase.stories} variant={variant} />
    </section>
  );
});

const LoadingSection = memo<{ variant: Variant }>(({ variant }) => (
  <section className={classes.section} aria-busy>
    <Skeleton height={20} width={160} radius={6} />
    <NewsGrid stories={undefined} variant={variant} skeletons={SKELETON_COUNT[variant]} />
  </section>
));

export const NewsTab: FC<TabProps> = ({ tournament }) => {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  const { data: items, isLoading, isError, refetch } = useTournamentNews(tournament);
  const phases = useMemo(() => (items ? buildPhases(items, tournament) : []), [items, tournament]);
  const retry = useCallback(() => void refetch(), [refetch]);
  const variant = isMobile ? 'row' : 'card';
  return (
    <div className={clsx(utils.container, page.tabSection, classes.tab)}>
      {isLoading && <LoadingSection variant={variant} />}
      {isError && !items && (
        <RetryState
          message={t({
            message: 'Couldn’t load the news for this tournament.',
            comment: 'News tab error message, shown with a Try again button',
          })}
          onRetry={retry}
          compact
        />
      )}
      {items && !items.length && (
        <EmptyState>
          <Trans comment="News tab empty state">No stories about this tournament yet.</Trans>
        </EmptyState>
      )}
      {phases.map((p) => (
        <PhaseSection key={p.key} phase={p} variant={variant} />
      ))}
    </div>
  );
};
