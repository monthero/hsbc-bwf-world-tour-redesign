import { ActionIcon } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { MediaItem } from '~/api/schemas';
import { IconWatchFilled, Tip } from '~/components/ui';
import { useMediaAvailable } from '~/hooks/useTournamentMedia';
import { watchUrl } from '~/utils/media';

import { REGION_NOTE } from './VideoCard';

import utils from '~/styles/utils.module.css';

const WATCH_ICON = <IconWatchFilled size={18} />;
const BUTTON_PROPS = { variant: 'tint', color: 'red', size: 32, radius: 'xl' } as const;

export const WatchLive = memo<{ item: MediaItem; className?: string }>(({ item, className }) => {
  const available = useMediaAvailable(item);
  const cls = clsx(utils.raise, className);
  if (!available)
    return (
      <Tip label={REGION_NOTE}>
        <ActionIcon {...BUTTON_PROPS} component="span" className={cls} data-disabled aria-label={REGION_NOTE}>
          {WATCH_ICON}
        </ActionIcon>
      </Tip>
    );
  return (
    <Tip tap={false} label={item.title}>
      <ActionIcon
        {...BUTTON_PROPS}
        component="a"
        href={watchUrl(item.id)}
        target="_blank"
        rel="noreferrer"
        className={cls}
        aria-label={`Watch on YouTube: ${item.title}`}
      >
        {WATCH_ICON}
      </ActionIcon>
    </Tip>
  );
});
