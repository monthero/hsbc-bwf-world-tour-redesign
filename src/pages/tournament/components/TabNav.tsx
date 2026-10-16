import type { I18n } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { useMergedRef } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type Ref, type RefObject } from 'react';

import { LevelBadge, LogoTile, TournamentStatusBadge } from '~/components/tournament';
import { IconBack, IconButton, LiveDot, StickyBar, TabBar, type TabItem } from '~/components/ui';
import { useScrolledPast } from '~/hooks/useScrolledPast';
import type { Tournament } from '~/types';

import { OFF_TIPS, TAB_LABELS } from '../constants';
import { useCalendarBack, useUpdateSearch } from '../hooks';
import { TournamentTab, type TabAvailability } from '../types';

import classes from './TabNav.module.css';
import utils from '~/styles/utils.module.css';

const SENTINEL_OPTS = { offset: 0 };

const LIVE_BADGE = <LiveDot pulse size={6} />;

const tabItems = (i18n: I18n, available: TabAvailability | null, hasLive: boolean): TabItem<TournamentTab>[] =>
  TournamentTab.options.map((id) => {
    const off = !!available && !available[id];
    const tip = OFF_TIPS[id];
    return {
      value: id,
      label: i18n._(TAB_LABELS[id]),
      disabled: off,
      tip: off && tip ? i18n._(tip) : undefined,
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
}>(({ ref, anchorRef, tournament, tab, available, hasLive }) => {
  const { t, i18n } = useLingui();
  const update = useUpdateSearch();
  const back = useCalendarBack(tournament.year);
  const [sentinelRef, mini] = useScrolledPast<HTMLDivElement>(SENTINEL_OPTS);
  const anchor = useMergedRef(anchorRef, sentinelRef);
  const items = useMemo(() => tabItems(i18n, available, hasLive), [i18n, available, hasLive]);

  const onSelect = useCallback((v: TournamentTab) => update({ tab: v }), [update]);

  return (
    <>
      <div ref={anchor} className={classes.anchor} />
      <StickyBar ref={ref} glass zIndex={20} className={classes.bar} data-mini={mini || undefined}>
        <div className={classes.mini} inert={!mini}>
          <div className={clsx(utils.container, classes.miniRow)}>
            <IconButton
              label={t({ message: 'Back to calendar', comment: 'Icon button in the condensed tournament bar' })}
              link={back.link}
              shape="rounded"
              className={classes.miniBack}
            >
              <IconBack size={18} />
            </IconButton>
            <LogoTile src={tournament.logo} size={28} flat />
            <span className={clsx(utils.ellipsis, utils.bidiAuto, classes.miniTitle)}>{tournament.heading}</span>
            <LevelBadge level={tournament.level} size="sm" long />
            <TournamentStatusBadge tournament={tournament} variant="inline" short className={classes.miniStatus} />
          </div>
        </div>
        <TabBar
          items={items}
          value={tab}
          onChange={onSelect}
          ariaLabel={t({ message: 'Tournament sections', comment: 'Accessible name of the tournament tab bar' })}
          className={utils.container}
        />
      </StickyBar>
    </>
  );
});
