import { useLingui } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { EventTag, TeamPlayers } from '~/components/match';
import { PlayerAvatar, WorldRankTag } from '~/components/player';
import { MiniRow, StickyBar, TabBar, type TabItem } from '~/components/ui';
import type { EventCode, Player, RankView } from '~/types';
import { formatNumber } from '~/utils/format';

import { PLAYER_TAB_ITEMS } from '../constants';
import type { PlayerTab } from '../types';
import { EventPicker } from './EventPicker';

import classes from './SubNav.module.css';

const MINI_PHOTO = 28;

export const SubNav = memo<{
  player: Player;
  rank: RankView | undefined;
  compact: boolean;
  tab: PlayerTab;
  onTab: (tab: PlayerTab) => void;
  mediaCount: number | undefined;
}>(({ player, rank, compact, tab, onTab, mediaCount }) => {
  const { t, i18n } = useLingui();
  const items = useMemo(
    (): TabItem<PlayerTab>[] =>
      PLAYER_TAB_ITEMS.map((it) => {
        const item = { value: it.value, label: i18n._(it.label) };
        return it.value === 'media' && mediaCount
          ? { ...item, badge: <span className={classes.count}>{formatNumber(mediaCount)}</span> }
          : item;
      }),
    [i18n, mediaCount],
  );
  const players = useMemo(() => [player], [player]);
  return (
    <StickyBar zIndex={6}>
      <MiniRow open={compact}>
        <PlayerAvatar player={player} size={MINI_PHOTO} />
        <TeamPlayers players={players} flag="sm" link={false} truncate className={classes.miniName} />
        {rank?.rank && (
          <span className={classes.miniRank}>
            <WorldRankTag rank={rank.rank} event={rank.ev} />
            <EventTag event={rank.ev} />
          </span>
        )}
      </MiniRow>
      <TabBar items={items} value={tab} onChange={onTab} ariaLabel={t`Player sections`} />
    </StickyBar>
  );
});

export const Disciplines = memo<{
  events: readonly EventCode[];
  event: EventCode | undefined;
  onEvent: (event: EventCode | undefined) => void;
}>(({ events, event, onEvent }) => (
  <div className={classes.disciplines}>
    <EventPicker events={events} value={event} onChange={onEvent} />
  </div>
));
