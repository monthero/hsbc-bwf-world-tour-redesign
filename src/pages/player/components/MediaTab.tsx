import { Skeleton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import type { NewsBrief, PlayerVideo } from '~/api/schemas';
import { VideoCard } from '~/components/media';
import { NewsGrid } from '~/components/news';
import { EmptyState, Eyebrow, SectionTitle } from '~/components/ui';
import { useTournamentLookup } from '~/hooks/useNews';
import { useTournamentMedia } from '~/hooks/useTournamentMedia';
import { useTournamentsByCode } from '~/hooks/useTournaments';
import type { PlayerMatch, Tournament } from '~/types';
import type { BriefStory } from '~/utils/news';
import { tournamentParams } from '~/utils/tournaments';

import { NEWS_STEP, VIDEO_LABELS, VIDEO_STEP } from '../constants';
import { usePlayerMedia, usePlayerMediaCount } from '../hooks';
import {
  archivedVideos,
  groupNews,
  groupVideos,
  indexPlayerMatches,
  liveVideos,
  mergeVideos,
  toStories,
  type VideoEntry,
  type VideoGroup,
} from '../media';

import classes from './MediaTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

const NO_LIVE: VideoEntry[] = [];
const NO_VIDEOS: PlayerVideo[] = [];
const NO_NEWS: NewsBrief[] = [];
const SKELETON_ROWS = 4;
const EMPTY = 'No BWF TV videos or news stories mention this player yet.';
const FAILED = 'Couldn’t load videos and news right now.';

interface MediaTabProps {
  playerId: string;
  matches: readonly PlayerMatch[];
}

const useLimit = (step: number) => {
  const [limit, setLimit] = useState(step);
  const more = useCallback(() => setLimit((n) => n + step), [step]);
  return [limit, more] as const;
};

const MoreButton = memo<{ hidden: number; step: number; onClick: () => void }>(({ hidden, step, onClick }) =>
  hidden > 0 ? (
    <button type="button" className={clsx(shared.more, classes.more)} onClick={onClick}>
      Show {Math.min(hidden, step)} more
    </button>
  ) : null,
);

const GroupLabel = memo<{ tournament: Tournament | undefined }>(({ tournament: t }) =>
  t ? (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      search={{ tab: 'media' }}
      className={classes.groupLink}
    >
      <Eyebrow>{t.shortTitle}</Eyebrow>
    </Link>
  ) : null,
);

const VideoGroupBlock = memo<{ group: VideoGroup }>(({ group }) => (
  <div className={classes.group}>
    <GroupLabel tournament={group.tournament} />
    <div className={classes.videos}>
      {group.entries.map((e) => (
        <VideoCard
          key={e.item.id}
          item={e.item}
          match={e.match}
          label={VIDEO_LABELS[e.item.kind]}
          eventName={e.tournament?.name}
        />
      ))}
    </div>
  </div>
));

const VideosPanel = memo<{ videos: readonly VideoEntry[] }>(({ videos }) => {
  const [limit, more] = useLimit(VIDEO_STEP);
  const groups = useMemo(() => groupVideos(videos.slice(0, limit)), [videos, limit]);
  return (
    <section className={clsx(utils.card, shared.panel)}>
      <SectionTitle count={videos.length}>Videos</SectionTitle>
      {groups.map((g) => (
        <VideoGroupBlock key={g.key} group={g} />
      ))}
      <MoreButton hidden={videos.length - limit} step={VIDEO_STEP} onClick={more} />
    </section>
  );
});

const NewsPanel = memo<{ stories: readonly BriefStory[] }>(({ stories }) => {
  const [limit, more] = useLimit(NEWS_STEP);
  const groups = useMemo(() => groupNews(stories.slice(0, limit), stories.length), [stories, limit]);
  return (
    <section className={clsx(utils.card, shared.panel)}>
      <SectionTitle count={stories.length}>News</SectionTitle>
      {groups.map((g) => (
        <div key={g.key} className={classes.group}>
          {g.label && <Eyebrow>{g.label}</Eyebrow>}
          <NewsGrid stories={g.stories} variant="row" />
        </div>
      ))}
      <MoreButton hidden={stories.length - limit} step={NEWS_STEP} onClick={more} />
    </section>
  );
});

const LoadingPanel = memo(() => (
  <div className={clsx(utils.card, shared.panel)} aria-busy>
    <Skeleton height={18} width={120} radius={6} />
    <NewsGrid stories={undefined} variant="row" skeletons={SKELETON_ROWS} />
  </div>
));

const MediaContent = memo<MediaTabProps & { live: readonly VideoEntry[] }>(({ playerId, matches, live }) => {
  const count = usePlayerMediaCount(playerId);
  const file = usePlayerMedia(playerId, !!count.data);
  const byCode = useTournamentsByCode();
  const lookup = useTournamentLookup();
  const index = useMemo(() => indexPlayerMatches(matches), [matches]);
  const archived = file.data?.videos ?? NO_VIDEOS;
  const videos = useMemo(
    () => mergeVideos(archivedVideos(archived, index, byCode), live),
    [archived, index, byCode, live],
  );
  const news = file.data?.news ?? NO_NEWS;
  const stories = useMemo(() => toStories(news, lookup), [news, lookup]);
  const pending = count.isPending || file.isLoading;
  const failed = count.isError || file.isError;
  return (
    <div className={shared.stack}>
      {pending && <LoadingPanel />}
      {!pending && !videos.length && !stories.length && <EmptyState>{failed ? FAILED : EMPTY}</EmptyState>}
      {videos.length > 0 && <VideosPanel videos={videos} />}
      {stories.length > 0 && <NewsPanel stories={stories} />}
    </div>
  );
});

const WithLive = memo<MediaTabProps & { tournament: Tournament }>(({ tournament, playerId, matches }) => {
  const { items, matchOf } = useTournamentMedia(tournament);
  const live = useMemo(() => liveVideos(items, matchOf, playerId, tournament), [items, matchOf, playerId, tournament]);
  return <MediaContent playerId={playerId} matches={matches} live={live} />;
});

export const MediaTab = memo<MediaTabProps>(({ playerId, matches }) => {
  const current = useMemo(() => matches.find((pm) => pm.tournament.status === 'live')?.tournament, [matches]);
  if (current) return <WithLive tournament={current} playerId={playerId} matches={matches} />;
  return <MediaContent playerId={playerId} matches={matches} live={NO_LIVE} />;
});
