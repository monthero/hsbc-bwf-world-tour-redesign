import { memo, useMemo } from 'react';

import { FollowButton } from '~/components/follow';
import { StickyBar, TabBar } from '~/components/ui';
import type { Player } from '~/types';

import { PLAYER_TAB_ITEMS } from '../constants';
import type { PlayerTab } from '../types';

interface SubNavProps {
  tab: PlayerTab;
  onTab: (tab: PlayerTab) => void;
  player: Player;
}

export const SubNav = memo<SubNavProps>(({ tab, onTab, player }) => {
  const players = useMemo(() => [player], [player]);
  return (
    <StickyBar zIndex={6}>
      <TabBar
        items={PLAYER_TAB_ITEMS}
        value={tab}
        onChange={onTab}
        ariaLabel="Player sections"
        end={<FollowButton players={players} withLabel variant="pill" />}
      />
    </StickyBar>
  );
});
