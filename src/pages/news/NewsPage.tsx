import { Button } from '@mantine/core';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import type { VirtualItem } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';

import { newsMonthQuery, useFetchNewsMonths, useNewsIndex, useNewsMonths } from '~/api/news';
import type { NewsIndex, NewsMonth, NewsMonthCount } from '~/api/schemas';
import { PopularNews } from '~/components/news';
import { PageHeader, RetryState } from '~/components/ui';
import { SEASON_YEAR } from '~/constants';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useTournamentLookup } from '~/hooks/useNews';
import { useWindowList } from '~/hooks/useWindowList';
import { monthKeyOf, monthOf } from '~/utils/dates';
import { STAY } from '~/utils/navigation';
import { toStories, type NewsStory, type TournamentLookup } from '~/utils/news';
import { scrollBehavior } from '~/utils/scroll';

import { ArchiveRow } from './components/ArchiveRow';
import { LatestSection } from './components/LatestSection';
import { MonthChips } from './components/MonthChips';
import { MonthRail } from './components/MonthRail';
import {
  INITIAL_MONTHS,
  LATEST_COUNT,
  LOAD_AHEAD,
  monthSectionId,
  NAV_GAP,
  NEWS_META,
  NEWS_TITLE,
  OFFICIAL_NEWS_URL,
  POPULAR_COUNT,
  SECTION,
  sectionMonth,
  URL_SYNC_MS,
} from './constants';
import type { MonthGroup, NavItem, NewsSearch, Probe } from './types';
import { useSectionSpy } from './useSectionSpy';
import { buildArchive, buildRows, columnsFor, estimateRow } from './utils';

import classes from './NewsPage.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/news');

const TITLE_SITE = { season: SEASON_YEAR };
const NO_MONTHS: NewsMonthCount[] = [];

const selectMonth = (s: NewsSearch) => s.month;

const STORIES = new WeakMap<NewsMonth, { lookup: TournamentLookup | undefined; stories: NewsStory[] }>();

const storiesOf = (page: NewsMonth, lookup: TournamentLookup | undefined) => {
  const hit = STORIES.get(page);
  if (hit && hit.lookup === lookup) return hit.stories;
  const stories = toStories(page.items, lookup);
  STORIES.set(page, { lookup, stories });
  return stories;
};

interface JumpTarget {
  key: string;
  instant: boolean;
}

interface Snapshot {
  asOf: string;
  depth: number;
  perRow: number;
  sizes: VirtualItem[];
}

let saved: Snapshot | null = null;

const LEAD_NAV: readonly NavItem[] = [
  { id: SECTION.latest, label: 'Latest', short: 'Latest' },
  { id: SECTION.popular, label: 'Most popular', short: 'Popular' },
];

export const NewsPage: FC = () => {
  useDocumentTitle('News', TITLE_SITE);
  const isMobile = useIsMobile();
  const { data, isError, refetch } = useNewsIndex();
  const retry = useCallback(() => void refetch(), [refetch]);
  return (
    <div className={classes.page}>
      <PageHeader kicker="News" title={NEWS_TITLE} meta={NEWS_META} />
      {isError && !data ? (
        <div className={utils.container}>
          <RetryState message="Couldn’t load the latest news." onRetry={retry} className={classes.error}>
            <Button
              component="a"
              href={OFFICIAL_NEWS_URL}
              target="_blank"
              rel="noreferrer"
              variant="subtle"
              radius="xl"
            >
              Read on the official site
            </Button>
          </RetryState>
        </div>
      ) : (
        <Feed index={data} isMobile={isMobile} />
      )}
    </div>
  );
};

const Feed: FC<{ index: NewsIndex | undefined; isMobile: boolean }> = ({ index, isMobile }) => {
  const lookup = useTournamentLookup();
  const queryClient = useQueryClient();
  const navigate = route.useNavigate();
  const linked = route.useSearch({ select: selectMonth });
  const barRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<Probe | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const gap = isMobile ? NAV_GAP.mobile : NAV_GAP.desktop;
  const { active, register, jump, offset } = useSectionSpy(gap, barRef, probeRef);
  const popularRef = useCallback((el: HTMLElement | null) => register(SECTION.popular, el), [register]);

  const latest = useMemo(() => index && toStories(index.latest.slice(0, LATEST_COUNT), lookup), [index, lookup]);
  const popular = useMemo(() => index && toStories(index.popular.slice(0, POPULAR_COUNT), lookup), [index, lookup]);
  const archive = useMemo(() => index && buildArchive(index.months), [index]);

  const months = index?.months ?? NO_MONTHS;
  const currentKey = index ? monthKeyOf(index.asOf) : '';
  const [restored] = useState(() => (linked && index && saved?.asOf === index.asOf ? saved : null));
  const [depth, setDepth] = useState(restored?.depth ?? INITIAL_MONTHS);
  const [target, setTarget] = useState<JumpTarget | null>(() =>
    linked && !restored ? { key: linked, instant: true } : null,
  );
  const targetIdx = target ? months.findIndex((m) => m.month === target.key) : -1;
  const pending = target && (!index || targetIdx >= 0) ? target : null;
  const shown = Math.max(depth, targetIdx + 1);
  const states = useNewsMonths(months, shown);

  const groups = useMemo<MonthGroup[]>(
    () =>
      states.map((st, i) => {
        const key = months[i]?.month ?? '';
        const month = monthOf(key);
        return {
          key,
          order: i,
          id: monthSectionId(key),
          name: month.format('MMMM'),
          year: month.year(),
          total: months[i]?.count ?? 0,
          stories: st.page && storiesOf(st.page, lookup),
          failed: st.failed,
        };
      }),
    [states, months, lookup],
  );

  const { ref: sizeRef, width } = useElementSize<HTMLElement>();
  const columns = width ? columnsFor(width) : (restored?.perRow ?? 1);
  const perRow = isMobile ? 1 : columns;
  const rows = useMemo(() => buildRows(groups, perRow, isMobile), [groups, perRow, isMobile]);
  const estimate = useCallback(
    (i: number) => estimateRow(rows[i], isMobile, width, perRow),
    [rows, isMobile, width, perRow],
  );
  const getItemKey = useCallback((i: number) => rows[i]?.key ?? i, [rows]);
  const list = useWindowList<HTMLElement>(rows.length, estimate, {
    getItemKey,
    initialMeasurementsCache: restored?.sizes,
    scrollPaddingStart: offset,
  });
  const { virtualizer, items } = list;
  const listRef = useMergedRef(list.ref, sizeRef);

  const from = rows[items[0]?.index ?? -1]?.group.order ?? 0;
  const to = rows[items.at(-1)?.index ?? -1]?.group.order ?? -1;
  const visible = useMemo(() => months.slice(from, to + 1).map((m) => m.month), [months, from, to]);
  useFetchNewsMonths(visible);

  useEffect(() => {
    probeRef.current = (y) => {
      if (!rows.length || y < virtualizer.options.scrollMargin) return undefined;
      const item = virtualizer.getVirtualItemForOffset(y);
      return item && rows[item.index]?.group.id;
    };
  }, [rows, virtualizer]);

  useEffect(
    () => () => {
      if (index) saved = { asOf: index.asOf, depth: shown, perRow, sizes: virtualizer.takeSnapshot() };
    },
    [index, shown, perRow, virtualizer],
  );

  const headIdx = useMemo(
    () => (pending ? rows.findIndex((r) => r.kind === 'head' && r.group.key === pending.key) : -1),
    [rows, pending],
  );

  useEffect(() => {
    if (!pending || headIdx < 0 || !offset) return;
    const raf = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(headIdx, { align: 'start', behavior: scrollBehavior(pending.instant) });
      setDepth((d) => Math.max(d, targetIdx + 1));
      setTarget(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [pending, headIdx, offset, targetIdx, virtualizer]);

  const last = states.at(-1);
  const canLoad = !pending && shown < months.length && !!last?.settled && !last.failed;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!canLoad || !el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setDepth(shown + 1), { rootMargin: LOAD_AHEAD });
    io.observe(el);
    return () => io.disconnect();
  }, [canLoad, shown]);

  const activeKey = sectionMonth(active);

  useEffect(() => {
    if (pending || !index || activeKey === linked) return;
    const timer = window.setTimeout(
      () => void navigate({ search: (s) => ({ ...s, month: activeKey }), ...STAY }),
      URL_SYNC_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pending, index, activeKey, linked, navigate]);

  const monthNav = useMemo<NavItem[] | undefined>(
    () =>
      index &&
      groups.map((g) => {
        const sameYear = g.year === monthOf(currentKey).year();
        const short = monthOf(g.key).format(sameYear ? 'MMM' : 'MMM YY');
        return { id: g.id, label: sameYear ? g.name : `${g.name} ${g.year}`, short, count: g.total };
      }),
    [index, groups, currentKey],
  );
  const chips = useMemo(() => [...LEAD_NAV, ...(monthNav ?? [])], [monthNav]);

  const onPick = useCallback((key: string) => setTarget({ key, instant: false }), []);
  const onJump = useCallback(
    (id: string) => {
      const key = sectionMonth(id);
      if (key) onPick(key);
      else jump(id);
    },
    [onPick, jump],
  );
  const onRetry = useCallback(
    (key: string) => void queryClient.refetchQueries({ queryKey: newsMonthQuery(key).queryKey }),
    [queryClient],
  );
  const picked = pending?.key ?? activeKey ?? null;

  return (
    <>
      {isMobile && (
        <MonthChips
          ref={barRef}
          items={chips}
          active={active}
          onJump={onJump}
          years={archive}
          month={picked}
          onPick={onPick}
        />
      )}
      <div className={utils.container}>
        <LatestSection stories={latest} isMobile={isMobile} register={register} />
        {(!index || !!popular?.length) && <PopularNews stories={popular} ref={popularRef} />}
      </div>
      <div className={clsx(utils.container, classes.feed)}>
        {!isMobile && <MonthRail years={archive} current={picked} onPick={onPick} />}
        <main ref={listRef} className={classes.months}>
          <div style={{ height: list.before }} />
          {items.map((it) => {
            const row = rows[it.index];
            return (
              row && (
                <ArchiveRow
                  key={row.key}
                  row={row}
                  index={it.index}
                  measure={list.measure}
                  compact={isMobile}
                  columns={perRow}
                  currentKey={currentKey}
                  onRetry={onRetry}
                />
              )
            );
          })}
          <div style={{ height: list.after }} />
          <div ref={sentinelRef} />
        </main>
      </div>
    </>
  );
};
