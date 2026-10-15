import { Button } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { MediaItem } from '~/api/schemas';
import { IconStream, Tip } from '~/components/ui';
import { useMediaAvailable } from '~/hooks/useTournamentMedia';
import { watchUrl } from '~/utils/media';

import { REGION_NOTE } from './VideoCard';

import utils from '~/styles/utils.module.css';

const STREAM_ICON = <IconStream />;
const LABEL = 'Watch';
const BUTTON_PROPS = { variant: 'quiet', size: 'compact-xs', radius: 'xl', leftSection: STREAM_ICON } as const;

export const WatchLive = memo<{ item: MediaItem; className?: string }>(({ item, className }) => {
  const available = useMediaAvailable(item);
  const cls = clsx(utils.raise, className);
  if (!available)
    return (
      <Tip label={REGION_NOTE}>
        <Button {...BUTTON_PROPS} component="span" className={cls} data-disabled aria-label={REGION_NOTE}>
          {LABEL}
        </Button>
      </Tip>
    );
  return (
    <Tip tap={false} label={item.title}>
      <Button
        {...BUTTON_PROPS}
        component="a"
        href={watchUrl(item.id)}
        target="_blank"
        rel="noreferrer"
        className={cls}
        aria-label={`Watch on YouTube: ${item.title}`}
      >
        {LABEL}
      </Button>
    </Tip>
  );
});
