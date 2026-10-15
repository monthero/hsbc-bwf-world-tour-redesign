import { ActionIcon } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type ReactNode } from 'react';

import type { MediaItem } from '~/api/schemas';
import { IconWatchFilled, InfoTip, Tip } from '~/components/ui';
import { useMediaAvailable } from '~/hooks/useTournamentMedia';
import { watchUrl } from '~/utils/media';

import { REGION_NOTE } from './VideoCard';

import classes from './WatchButton.module.css';
import utils from '~/styles/utils.module.css';

type WatchSize = 'sm' | 'md';

const ICONS: Record<WatchSize, ReactNode> = {
  sm: <IconWatchFilled size={15} />,
  md: <IconWatchFilled size={18} />,
};
const BUTTON_PROPS = { variant: 'tint', color: 'red', size: 32, radius: 'xl' } as const;

export const WatchButton = memo<{ item: MediaItem; size?: WatchSize; className?: string }>(
  ({ item, size = 'md', className }) => {
    const available = useMediaAvailable(item);
    const label = available ? `Watch on YouTube: ${item.title}` : REGION_NOTE;
    const link = available ? { href: watchUrl(item.id), target: '_blank', rel: 'noreferrer' } : {};
    const icon = ICONS[size];
    const el =
      size === 'sm' ? (
        <a
          {...link}
          className={clsx(utils.raise, classes.tag, className)}
          data-disabled={!available || undefined}
          aria-label={label}
          aria-disabled={!available || undefined}
        >
          {icon}
        </a>
      ) : (
        <ActionIcon
          {...BUTTON_PROPS}
          {...link}
          component={available ? 'a' : 'span'}
          className={clsx(utils.raise, classes.button, className)}
          data-disabled={!available || undefined}
          aria-label={label}
        >
          {icon}
        </ActionIcon>
      );
    return (
      <Tip
        tap={!available}
        label={available ? <InfoTip title="Watch on YouTube" subtitle={item.title} /> : REGION_NOTE}
      >
        {el}
      </Tip>
    );
  },
);
