import { useMergedRef } from '@mantine/hooks';
import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type Ref, type RefObject } from 'react';

import { LevelBadge, LogoTile, TournamentStatusBadge } from '~/components/tournament';
import { IconBack, IconButton, LiveDot, StickyBar, TabBar, type TabItem } from '~/components/ui';
import { useScrolledPast } from '~/hooks/useScrolledPast';
import type { Tournament } from '~/types';

import { OFF_TIPS, TAB_LABELS } from '../constants';
import { useCalendarBack } from '../hooks';
import { TournamentTab, type TabAvailability } from '../types';

import classes from './TabNav.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/world-tour/$year/$slug');

const SENTINEL_OPTS = { offset: 0 };

const LIVE_BADGE = <LiveDot pulse size={6} />;

const tabItems = (available: TabAvailability | null, hasLive: boolean): TabItem<TournamentTab>[] =>
  TournamentTab.options.map((id) => {
    const off = !!available && !available[id];
    return {
      value: id,
      label: TAB_LABELS[id],
      disabled: off,
      tip: off ? OFF_TIPS[id] : undefined,
      badge: id === 'matches' && hasLive ? LIVE_BADGE : undefined,
    };
  });

export const TabNav = memo<{
  ref: Ref<HTMLDivElement>;
  anchorRef: RefObject<HTMLDivElement | null>;
  tournament: Tournament;
  tab: TournamentTab;
  available: TabAvailability | null;
  hasLive: boolean;
}>(({ ref, anchorRef, tournament: t, tab, available, hasLive }) => {
  const navigate = route.useNavigate();
  const back = useCalendarBack(t.year);
  const [sentinelRef, mini] = useScrolledPast<HTMLDivElement>(SENTINEL_OPTS);
  const anchor = useMergedRef(anchorRef, sentinelRef);
  const items = useMemo(() => tabItems(available, hasLive), [available, hasLive]);

  const onSelect = useCallback(
    (v: TournamentTab) => void navigate({ search: (s) => ({ ...s, tab: v }), replace: true, resetScroll: false }),
    [navigate],
  );

  return (
    <>
      <div ref={anchor} className={classes.anchor} />
      <StickyBar ref={ref} glass zIndex={20} className={classes.bar} data-mini={mini || undefined}>
        <div className={classes.mini} inert={!mini}>
          <div className={clsx(utils.container, classes.miniRow)}>
            <IconButton label="Back to calendar" link={back.link} shape="rounded" className={classes.miniBack}>
              <IconBack size={18} />
            </IconButton>
            <LogoTile src={t.logo} size={28} flat />
            <span className={clsx(utils.ellipsis, classes.miniTitle)}>{t.heading}</span>
            <LevelBadge level={t.level} size="sm" long />
            <TournamentStatusBadge tournament={t} variant="inline" short className={classes.miniStatus} />
          </div>
        </div>
        <TabBar
          items={items}
          value={tab}
          onChange={onSelect}
          ariaLabel="Tournament sections"
          className={utils.container}
        />
      </StickyBar>
    </>
  );
});
