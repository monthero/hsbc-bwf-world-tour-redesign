import { Skeleton } from '@mantine/core';
import { getRouteApi, useCanGoBack, useRouter } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { MatchDetailModal } from '~/components/match';
import { BackPill } from '~/components/ui';
import { NOT_FOUND, SEASON_YEAR } from '~/constants';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';
import { usePlayerProfile } from '~/hooks/useSeason';
import { useTournamentsByCode } from '~/hooks/useTournaments';
import type { EventCode, PlayerMatch } from '~/types';
import { tournamentParams } from '~/utils/tournaments';

import { Hero } from './components/Hero';
import { MatchesTab } from './components/MatchesTab';
import { OverviewTab } from './components/OverviewTab';
import { RankingsTab } from './components/RankingsTab';
import { ResultsTab } from './components/ResultsTab';
import { SubNav } from './components/SubNav';
import { usePlayerHistory } from './hooks';
import type { PlayerTab } from './types';
import { careerHighs, careerOf, eventsOf, partnerHistory } from './utils';

import classes from './PlayerPage.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/players/$id');

const STAY = { replace: true, resetScroll: false } as const;

export const PlayerPage: FC = () => {
  const { id } = route.useParams();
  return <PlayerProfile key={id} id={id} />;
};

const Back = memo<{ from: string | undefined }>(({ from }) => {
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

const PlayerProfile: FC<{ id: string }> = ({ id }) => {
  const { tab = 'overview', from, season, event } = route.useSearch();
  const navigate = route.useNavigate();
  const profile = usePlayerProfile(id);
  const { player, matches, ready, index, rankingId, bio, ranks } = profile;
  useDocumentTitle(!player && profile.status === 'missing' ? NOT_FOUND : [player?.name, 'Players'], 'bwf');
  const history = usePlayerHistory(rankingId, index);
  const career = useMemo(() => careerOf(matches), [matches]);
  const current = useMemo(() => career.seasons.find((s) => s.year === SEASON_YEAR), [career]);
  const events = useMemo(() => eventsOf(matches), [matches]);
  const active = event && events.includes(event) ? event : undefined;
  const scoped = useMemo(
    () => (active ? careerOf(matches.filter((pm) => pm.match.event === active)) : career),
    [active, matches, career],
  );
  const partners = useMemo(() => partnerHistory(matches, id), [matches, id]);
  const highs = useMemo(() => careerHighs(ranks, history.view), [ranks, history.view]);
  const [selected, setSelected] = useState<PlayerMatch | null>(null);
  const closeMatch = useCallback(() => setSelected(null), []);
  const setTab = useCallback(
    (t: PlayerTab) => void navigate({ search: (s) => ({ ...s, tab: t === 'overview' ? undefined : t }), ...STAY }),
    [navigate],
  );
  const setSeason = useCallback(
    (y: number) => void navigate({ search: (s) => ({ ...s, season: y }), ...STAY }),
    [navigate],
  );
  const setEvent = useCallback(
    (ev: EventCode | undefined) => void navigate({ search: (s) => ({ ...s, event: ev }), ...STAY }),
    [navigate],
  );
  const openSeason = useCallback(
    (y: number) => void navigate({ search: (s) => ({ ...s, tab: 'matches', season: y }), resetScroll: false }),
    [navigate],
  );
  const openResults = useCallback(() => setTab('results'), [setTab]);

  return (
    <section className={clsx(utils.container, classes.page)}>
      <Back from={from} />
      {!player && profile.status === 'missing' && (
        <span className={classes.message}>We couldn’t find this player.</span>
      )}
      {!player && profile.status !== 'missing' && <Skeleton height={340} radius={20} />}
      {player && (
        <>
          <Hero
            player={player}
            hero={profile.profile?.hero}
            focus={profile.profile?.heroFocus}
            seed={profile.seed}
            prize={bio.prize}
            ranks={ranks}
            highs={highs}
          />
          <SubNav tab={tab} onTab={setTab} player={player} />
          {tab === 'overview' && (
            <OverviewTab
              playerId={id}
              season={current}
              career={scoped}
              events={events}
              event={active}
              partners={partners}
              ready={ready}
              bio={bio}
              history={history.view}
              historyLoading={history.loading}
              onOpenMatch={setSelected}
              onSeason={openSeason}
              onEvent={setEvent}
              onResults={openResults}
            />
          )}
          {tab === 'matches' && (
            <MatchesTab
              playerId={id}
              seasons={scoped.seasons}
              events={events}
              season={season}
              event={active}
              ready={ready}
              onSeason={setSeason}
              onEvent={setEvent}
              onOpenMatch={setSelected}
            />
          )}
          {tab === 'results' && <ResultsTab history={history.view} loading={history.loading} />}
          {tab === 'rankings' && <RankingsTab ranks={ranks} history={history.view} loading={history.loading} />}
        </>
      )}
      {selected && <MatchDetailModal match={selected.match} tournament={selected.tournament} onClose={closeMatch} />}
    </section>
  );
};
