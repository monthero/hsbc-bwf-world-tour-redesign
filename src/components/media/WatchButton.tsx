import { useLingui } from '@lingui/react/macro';
import { ActionIcon } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type ReactNode } from 'react';

import type { MediaItem } from '~/api/schemas';
import { IconWatchFilled, InfoTip, Tip } from '~/components/ui';
import { useMediaAvailable } from '~/hooks/useTournamentMedia';
import { watchUrl } from '~/utils/media';

import { REGION_NOTE, replayLabel, WATCH_ON_YOUTUBE } from './labels';

import classes from './WatchButton.module.css';
import utils from '~/styles/utils.module.css';

type WatchSize = 'sm' | 'md' | 'strip';

const ICONS: Record<WatchSize, ReactNode> = {
  sm: <IconWatchFilled size={17} />,
  md: <IconWatchFilled size={18} />,
  strip: <IconWatchFilled size={18} />,
};
const BUTTON_PROPS = { variant: 'tint', color: 'red', size: 32, radius: 'xl' } as const;

export const WatchButton = memo<{ item: MediaItem; size?: WatchSize; className?: string }>(
  ({ item, size = 'md', className }) => {
    const available = useMediaAvailable(item);
    const { t, i18n } = useLingui();
    const title = item.title;
    const blocked = i18n._(REGION_NOTE);
    const label = available
      ? t({
          message: `Watch on YouTube: ${title}`,
          comment: 'Accessible name of a watch button; {title} is the video title',
        })
      : blocked;
    const link = available ? { href: watchUrl(item.id), target: '_blank', rel: 'noreferrer' } : {};
    const icon = ICONS[size];
    const el =
      size === 'md' ? (
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
      ) : (
        <a
          {...link}
          className={clsx(utils.raise, size === 'strip' ? classes.strip : classes.link, className)}
          data-disabled={!available || undefined}
          aria-label={label}
          aria-disabled={!available || undefined}
        >
          {size === 'strip' ? (
            <>
              <span className={classes.stripIcon}>{icon}</span>
              {i18n._(replayLabel(item))}
            </>
          ) : (
            icon
          )}
        </a>
      );
    return (
      <Tip tap={!available} label={available ? <InfoTip title={i18n._(WATCH_ON_YOUTUBE)} subtitle={title} /> : blocked}>
        {el}
      </Tip>
    );
  },
);
