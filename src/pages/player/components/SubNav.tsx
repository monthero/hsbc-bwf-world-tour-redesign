import { memo, useMemo } from 'react';

import { StickyBar, TabBar } from '~/components/ui';
import type { EventCode } from '~/types';
import { formatNumber } from '~/utils/format';

import { PLAYER_TAB_ITEMS } from '../constants';
import type { PlayerTab } from '../types';
import { EventPicker } from './EventPicker';

import classes from './SubNav.module.css';

export const SubNav = memo<{ tab: PlayerTab; onTab: (tab: PlayerTab) => void; mediaCount: number | undefined }>(
  ({ tab, onTab, mediaCount }) => {
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
        <TabBar items={items} value={tab} onChange={onTab} ariaLabel="Player sections" />
      </StickyBar>
    );
  },
);

export const Disciplines = memo<{
  events: readonly EventCode[];
  event: EventCode | undefined;
  onEvent: (event: EventCode | undefined) => void;
}>(({ events, event, onEvent }) => (
  <div className={classes.disciplines}>
    <EventPicker events={events} value={event} onChange={onEvent} />
  </div>
));
