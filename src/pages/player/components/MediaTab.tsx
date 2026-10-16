import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import type { NewsBrief, PlayerVideo } from '~/api/schemas';
import { VideoCard } from '~/components/media';
import { NewsGrid } from '~/components/news';
import { EmptyState, MoreButton } from '~/components/ui';
import { useTournamentLookup } from '~/hooks/useNews';
import { useTournamentMedia, useVisibleMedia } from '~/hooks/useTournamentMedia';
import { useTournamentsByCode } from '~/hooks/useTournaments';
import type { PlayerMatch, Tournament } from '~/types';
import { regionHiddenNote } from '~/utils/media';
import { toStories } from '~/utils/news';

import { NEWS_STEP, VIDEO_LABELS, VIDEO_STEP } from '../constants';
import { usePlayerMedia, usePlayerMediaCount } from '../hooks';
import { archivedVideos, indexPlayerMatches, liveVideos, mergeVideos, type VideoEntry } from '../media';
import { Section } from './parts';

import classes from './MediaTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface MediaProps {
  playerId: string;
  matches: readonly PlayerMatch[];
}

const NO_LIVE: VideoEntry[] = [];
const NO_VIDEOS: PlayerVideo[] = [];
const NO_NEWS: NewsBrief[] = [];
const TEASER_LIMIT = 2;
const EMPTY = msg`No BWF TV videos or news stories mention this player yet.`;
const FAILED = msg`Couldn’t load videos and news right now.`;

const emptyMessage = (i18n: I18n, failed: boolean, hidden: number) => {
  if (failed) return i18n._(FAILED);
  return hidden ? regionHiddenNote(hidden) : i18n._(EMPTY);
};

const usePlayerFeed = (playerId: string, matches: readonly PlayerMatch[], live: readonly VideoEntry[]) => {
  const count = usePlayerMediaCount(playerId);
  const file = usePlayerMedia(playerId, !!count.data);
  const byCode = useTournamentsByCode();
  const lookup = useTournamentLookup();
  const index = useMemo(() => indexPlayerMatches(matches), [matches]);
  const all = file.data?.videos ?? NO_VIDEOS;
  const archived = useVisibleMedia(all);
  const videos = useMemo(
    () => mergeVideos(archivedVideos(archived, index, byCode), live),
    [archived, index, byCode, live],
  );
  const news = file.data?.news ?? NO_NEWS;
  const stories = useMemo(() => toStories(news, lookup), [news, lookup]);
  return {
    videos,
    stories,
    pending: count.isPending || file.isLoading,
    failed: count.isError || file.isError,
    hidden: all.length - archived.length,
  };
};

const useLimit = (step: number) => {
  const [limit, setLimit] = useState(step);
  const more = useCallback(() => setLimit((n) => n + step), [step]);
  return [limit, more] as const;
};

const Video = memo<{ entry: VideoEntry }>(({ entry: e }) => {
  const { i18n } = useLingui();
  const label = VIDEO_LABELS[e.item.kind];
  return (
    <VideoCard
      item={e.item}
      match={e.match}
      label={label && i18n._(label)}
      eventName={e.tournament?.name}
      timeZone={e.tournament?.timeZone}
    />
  );
});

const LoadMore = memo<{ hidden: number; step: number; onClick: () => void }>(({ hidden, step, onClick }) =>
  hidden > 0 ? <MoreButton count={Math.min(hidden, step)} onClick={onClick} /> : null,
);

const MediaBody = memo<MediaProps & { live: readonly VideoEntry[] }>(({ playerId, matches, live }) => {
  const feed = usePlayerFeed(playerId, matches, live);
  const [videoLimit, moreVideos] = useLimit(VIDEO_STEP);
  const [newsLimit, moreNews] = useLimit(NEWS_STEP);
  const videos = useMemo(() => feed.videos.slice(0, videoLimit), [feed.videos, videoLimit]);
  const stories = useMemo(() => feed.stories.slice(0, newsLimit), [feed.stories, newsLimit]);
  const { i18n } = useLingui();
  const videoCount = feed.videos.length;
  const storyCount = feed.stories.length;
  if (feed.pending) return <Skeleton height={360} radius={18} />;
  if (!feed.videos.length && !feed.stories.length)
    return <EmptyState>{emptyMessage(i18n, feed.failed, feed.hidden)}</EmptyState>;
  return (
    <div className={clsx(utils.card, shared.panel)}>
      {videos.length > 0 && (
        <Section
          label={<Trans comment="Section title on the player Media tab">Videos</Trans>}
          aside={
            <span className={shared.sub}>
              <Plural value={videoCount} one="# video" other="# videos" />
            </span>
          }
        >
          <div className={classes.videos}>
            {videos.map((e) => (
              <Video key={e.item.id} entry={e} />
            ))}
          </div>
          <LoadMore hidden={feed.videos.length - videoLimit} step={VIDEO_STEP} onClick={moreVideos} />
        </Section>
      )}
      {stories.length > 0 && (
        <Section
          label={<Trans comment="Section title on the player Media tab">News</Trans>}
          aside={
            <span className={shared.sub}>
              <Plural value={storyCount} one="# story" other="# stories" />
            </span>
          }
        >
          <NewsGrid stories={stories} variant="row" />
          <LoadMore hidden={feed.stories.length - newsLimit} step={NEWS_STEP} onClick={moreNews} />
        </Section>
      )}
    </div>
  );
});

const WithLive = memo<MediaProps & { tournament: Tournament }>(({ tournament, playerId, matches }) => {
  const { items, matchOf } = useTournamentMedia(tournament);
  const live = useMemo(() => liveVideos(items, matchOf, playerId, tournament), [items, matchOf, playerId, tournament]);
  return <MediaBody playerId={playerId} matches={matches} live={live} />;
});

export const MediaTab = memo<MediaProps>(({ playerId, matches }) => {
  const current = useMemo(() => matches.find((pm) => pm.tournament.status === 'live')?.tournament, [matches]);
  if (current) return <WithLive tournament={current} playerId={playerId} matches={matches} />;
  return <MediaBody playerId={playerId} matches={matches} live={NO_LIVE} />;
});

export const MediaTeaser = memo<MediaProps & { onOpen: () => void }>(({ playerId, matches, onOpen }) => {
  const feed = usePlayerFeed(playerId, matches, NO_LIVE);
  const shown = useMemo(() => feed.videos.slice(0, TEASER_LIMIT), [feed.videos]);
  if (!shown.length) return null;
  return (
    <Section
      label={
        <Trans comment="Section title: the newest videos of this player on BWF TV, BWF’s YouTube channel">
          Latest on BWF TV
        </Trans>
      }
      aside={
        <button type="button" className={shared.link} onClick={onOpen}>
          <Trans comment="Link to the player’s Media tab">All media</Trans>
        </button>
      }
    >
      <div className={classes.teaser}>
        {shown.map((e) => (
          <Video key={e.item.id} entry={e} />
        ))}
      </div>
    </Section>
  );
});
