import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { MediaItem } from '~/api/schemas';

export const REGION_NOTE = msg({
  message: 'Not available in your region',
  comment: 'Shown on a YouTube video that is geo-blocked for the visitor',
});

export const WATCH_ON_YOUTUBE = msg`Watch on YouTube`;

const WATCH_FULL_MATCH = msg({
  message: 'Watch the full match',
  comment: 'Link on a finished match card to the full-length video of the match on YouTube',
});

const REPLAY_LABELS: Partial<Record<MediaItem['kind'], MessageDescriptor>> = {
  highlights: msg({
    message: 'Watch the highlights',
    comment: 'Link on a finished match card to the highlights video of the match on YouTube',
  }),
};

export const replayLabel = (item: MediaItem) => REPLAY_LABELS[item.kind] ?? WATCH_FULL_MATCH;
