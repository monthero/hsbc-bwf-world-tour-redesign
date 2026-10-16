import { useLingui } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { StickyBar, TabBar, type TabItem } from '~/components/ui';
import type { EventCode } from '~/types';
import { formatNumber } from '~/utils/format';

import { PLAYER_TAB_ITEMS } from '../constants';
import type { PlayerTab } from '../types';
import { EventPicker } from './EventPicker';

import classes from './SubNav.module.css';

export const SubNav = memo<{ tab: PlayerTab; onTab: (tab: PlayerTab) => void; mediaCount: number | undefined }>(
  ({ tab, onTab, mediaCount }) => {
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
    return (
      <StickyBar zIndex={6}>
        <TabBar items={items} value={tab} onChange={onTab} ariaLabel={t`Player sections`} />
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
