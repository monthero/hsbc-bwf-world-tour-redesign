import { Skeleton } from '@mantine/core';
import { getRouteApi, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { NotFound, type NotFoundAction } from '~/components/layout';
import { MatchDetailModal } from '~/components/match';
import { BackPill } from '~/components/ui';
import { NOT_FOUND } from '~/constants';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';
import { usePlayerProfile } from '~/hooks/useSeason';
import { useTournamentsByCode } from '~/hooks/useTournaments';
import type { EventCode, PlayerMatch } from '~/types';
import { STAY } from '~/utils/navigation';
import { tournamentParams } from '~/utils/tournaments';

import { Hero } from './components/Hero';
import { Kit } from './components/Kit';
import { MatchesTab } from './components/MatchesTab';
import { MediaTab } from './components/MediaTab';
import { OverviewTab } from './components/OverviewTab';
import { RankingsTab } from './components/RankingsTab';
import { ResultsTab } from './components/ResultsTab';
import { Disciplines, SubNav } from './components/SubNav';
import { usePlayerHistory, usePlayerMediaCount } from './hooks';
import type { PlayerSearch, PlayerTab } from './types';
import { careerHighs, careerOf, eventsOf, partnerHistory, rankedEventsOf, scopeHistory } from './utils';

import classes from './PlayerPage.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/players/$id');

const MISSING_TITLE = 'We couldn’t find that player';
const MISSING_DESCRIPTION = 'They may not have played on the World Tour yet, or the link is out of date.';
const MISSING_ACTION: NotFoundAction = { label: 'Back to rankings', link: { to: '/rankings' } };

export const PlayerPage: FC = () => {
  const { id } = route.useParams();
  const search = route.useSearch();
  return <PlayerProfile key={id} id={id} search={search} />;
};

export const Back = memo<{ from: string | undefined }>(({ from }) => {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const byCode = useTournamentsByCode();
  const tournament = from ? byCode?.get(from) : undefined;
  const goBack = useCallback(() => router.history.back(), [router]);
  if (canGoBack) return <BackPill onClick={goBack}>{tournament?.shortTitle ?? 'Back'}</BackPill>;
  if (tournament)
    return (
      <BackPill link={{ to: '/world-tour/$year/$slug', params: tournamentParams(tournament) }}>
        {tournament.shortTitle}
      </BackPill>
    );
  return <BackPill link={{ to: '/calendar' }}>Calendar</BackPill>;
});

export const PlayerProfile: FC<{ id: string; search: PlayerSearch }> = ({ id, search }) => {
  const { tab = 'overview', from, season, event: picked } = search;
  const navigate = useNavigate();
  const profile = usePlayerProfile(id);
  const { player, matches, ready, index, rankingId, bio, ranks } = profile;
  useDocumentTitle(!player && profile.status === 'missing' ? NOT_FOUND : [player?.name, 'Players'], 'bwf');
  const history = usePlayerHistory(rankingId, index);
  const mediaCount = usePlayerMediaCount(id).data;
  const matchEvents = useMemo(() => eventsOf(matches), [matches]);
  const rankEvents = useMemo(() => rankedEventsOf(history.view), [history.view]);
  const events = tab === 'rankings' ? rankEvents : matchEvents;
  const event = picked && events.includes(picked) ? picked : undefined;
  const scoped = useMemo(() => (event ? matches.filter((pm) => pm.match.event === event) : matches), [event, matches]);
  const career = useMemo(() => careerOf(matches), [matches]);
  const scopedCareer = useMemo(() => (event ? careerOf(scoped) : career), [event, scoped, career]);
  const partners = useMemo(() => partnerHistory(scoped, id), [scoped, id]);
  const highs = useMemo(() => careerHighs(ranks, history.view), [ranks, history.view]);
  const view = useMemo(() => scopeHistory(history.view, event), [history.view, event]);
  const [selected, setSelected] = useState<PlayerMatch | null>(null);
  const closeMatch = useCallback(() => setSelected(null), []);
  const setTab = useCallback(
    (t: PlayerTab) =>
      void navigate({ to: '.', search: (s) => ({ ...s, tab: t === 'overview' ? undefined : t }), ...STAY }),
    [navigate],
  );
  const setSeason = useCallback(
    (y: number) => void navigate({ to: '.', search: (s) => ({ ...s, season: y }), ...STAY }),
    [navigate],
  );
  const setEvent = useCallback(
    (ev: EventCode | undefined) => void navigate({ to: '.', search: (s) => ({ ...s, event: ev }), ...STAY }),
    [navigate],
  );
  const openSeason = useCallback(
    (y: number) => void navigate({ to: '.', search: (s) => ({ ...s, tab: 'matches', season: y }), resetScroll: false }),
    [navigate],
  );
  const openResults = useCallback(() => setTab('results'), [setTab]);
  const openMedia = useCallback(() => setTab('media'), [setTab]);

  if (!player && profile.status === 'missing')
    return <NotFound title={MISSING_TITLE} description={MISSING_DESCRIPTION} action={MISSING_ACTION} />;

  return (
    <section className={clsx(utils.container, classes.page)}>
      <Back from={from} />
      {!player && <Skeleton height={440} radius={22} />}
      {player && (
        <>
          <Hero
            player={player}
            hero={profile.profile?.hero}
            focus={profile.profile?.heroFocus}
            retired={profile.retired}
            bio={bio}
            ranks={ranks}
            highs={highs}
            career={career}
            ready={ready}
            event={event}
            onEvent={setEvent}
          />
          {bio.equipment.length > 0 && <Kit items={bio.equipment} />}
          <SubNav tab={tab} onTab={setTab} mediaCount={mediaCount} />
          {tab !== 'media' && events.length > 1 && <Disciplines events={events} event={event} onEvent={setEvent} />}
          {tab === 'overview' && (
            <OverviewTab
              playerId={id}
              matches={scoped}
              seasons={scopedCareer.seasons}
              titles={scopedCareer.titles}
              partners={partners}
              bio={bio}
              history={view}
              historyLoading={history.loading}
              ready={ready}
              retired={!!profile.retired}
              onOpenMatch={setSelected}
              onSeason={openSeason}
              onResults={openResults}
              onMedia={openMedia}
            />
          )}
          {tab === 'matches' && (
            <MatchesTab
              playerId={id}
              seasons={scopedCareer.seasons}
              season={season}
              ready={ready}
              onSeason={setSeason}
              onOpenMatch={setSelected}
            />
          )}
          {tab === 'results' && <ResultsTab history={view} loading={history.loading} />}
          {tab === 'rankings' && <RankingsTab ranks={ranks} history={view} loading={history.loading} />}
          {tab === 'media' && <MediaTab playerId={id} matches={matches} />}
        </>
      )}
      {selected && <MatchDetailModal match={selected.match} tournament={selected.tournament} onClose={closeMatch} />}
    </section>
  );
};
