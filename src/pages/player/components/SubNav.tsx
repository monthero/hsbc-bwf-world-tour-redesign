import { memo, useMemo } from 'react';

import { PlayerFollow } from '~/components/follow';
import { StickyBar, TabBar } from '~/components/ui';
import type { Player } from '~/types';
import { formatNumber } from '~/utils/format';

import { PLAYER_TAB_ITEMS } from '../constants';
import type { PlayerTab } from '../types';

import classes from './SubNav.module.css';

interface SubNavProps {
  tab: PlayerTab;
  onTab: (tab: PlayerTab) => void;
  player: Player;
  mediaCount: number | undefined;
}

export const SubNav = memo<SubNavProps>(({ tab, onTab, player, mediaCount }) => {
  const items = useMemo(
    () =>
      PLAYER_TAB_ITEMS.map((it) =>
        it.value === 'media' && mediaCount
          ? { ...it, badge: <span className={classes.count}>{formatNumber(mediaCount)}</span> }
          : it,
      ),
    [mediaCount],
  );
  return (
    <StickyBar zIndex={6}>
      <TabBar
        items={items}
        value={tab}
        onChange={onTab}
        ariaLabel="Player sections"
        end={<PlayerFollow player={player} withLabel variant="pill" />}
      />
    </StickyBar>
  );
});
