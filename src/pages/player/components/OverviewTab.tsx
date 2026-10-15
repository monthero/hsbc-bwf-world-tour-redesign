import { Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo } from 'react';

import { FormStrip, OutcomeLabel, ScoreChips, TeamPlayers } from '~/components/match';
import { WatchButton } from '~/components/media';
import { LevelBadge, LogoTile } from '~/components/tournament';
import { CardHit, Duration, EmptyState, LiveDot, MoreButton } from '~/components/ui';
import { EVENT_NAMES, SEASON_YEAR } from '~/constants';
import { useMatchReplays } from '~/hooks/useTournamentMedia';
import type { BioView, PlayerMatch } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { roundName } from '~/utils/matches';
import { opponentsOf, ownTeam, recentForm } from '~/utils/season';
import { tournamentParams } from '~/utils/tournaments';

import { RECENT_LIMIT, TITLE_LIMIT } from '../constants';
import type { HistoryView, PartnerRow, SeasonView } from '../types';
import {
  eventsOf,
  hasProfile,
  lastMatchOf,
  nextMatchOf,
  rivalsOf,
  seasonBreakdown,
  shareVars,
  tournamentsOf,
  winRate,
  winShare,
} from '../utils';
import { MediaTeaser } from './MediaTab';
import { LevelDot, ResultText, Section } from './parts';
import { PartnersSection, RivalsSection } from './People';
import { ProfileSection } from './ProfileSection';
import { RankTrend } from './RankTrend';

import classes from './OverviewTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface OverviewProps {
  playerId: string;
  matches: readonly PlayerMatch[];
  seasons: SeasonView[];
  titles: PlayerMatch[];
  partners: PartnerRow[];
  bio: BioView;
  history: HistoryView | undefined;
  historyLoading: boolean;
  ready: boolean;
  retired: boolean;
  onOpenMatch: (pm: PlayerMatch) => void;
  onSeason: (year: number) => void;
  onResults: () => void;
  onMedia: () => void;
}

type MatchKind = 'live' | 'next' | 'last';

const MATCH_LABELS: Record<MatchKind, string> = { live: 'Live now', next: 'Up next', last: 'Last match' };
const RIVAL_REPEAT_MIN = 3;
const RIVAL_LIMIT = 5;

const formOutcome = (pm: PlayerMatch): 'W' | 'L' => (pm.outcome === 'W' ? 'W' : 'L');

const formTip = (pm: PlayerMatch) =>
  `${pm.outcome === 'W' ? 'Won' : 'Lost'} vs ${opponentsOf(pm)
    .map((p) => p.name)
    .join(' / ')} · ${pm.tournament.shortTitle}`;

export const OverviewTab = memo<OverviewProps>(
  ({
    playerId,
    matches,
    seasons,
    titles,
    partners,
    bio,
    history,
    historyLoading,
    ready,
    retired,
    onOpenMatch,
    onSeason,
    onResults,
    onMedia,
  }) => {
    const next = useMemo(() => nextMatchOf(matches), [matches]);
    const last = useMemo(() => lastMatchOf(matches), [matches]);
    const multi = useMemo(() => eventsOf(matches).length > 1, [matches]);
    const rivals = useMemo(() => rivalsOf(matches, RIVAL_REPEAT_MIN, RIVAL_LIMIT), [matches]);
    const season = seasons[0];
    const trend = historyLoading || !!history?.results.some((g) => g.items.length > 1);
    const side = trend || partners.length > 1 || rivals.length > 0 || hasProfile(bio);
    return (
      <div className={classes.overview} data-side={side || undefined}>
        <div className={classes.column}>
          {!ready && <Skeleton height={420} radius={18} />}
          {ready && !season && <EmptyState>No World Tour matches on record since 2018.</EmptyState>}
          {(next || last) && (
            <div className={classes.matches}>
              {next && (
                <MatchCard
                  pm={next}
                  kind={next.outcome === 'Live' ? 'live' : 'next'}
                  multi={multi}
                  onOpen={onOpenMatch}
                />
              )}
              {last && (
                <MatchCard
                  pm={last}
                  kind="last"
                  label={retired ? 'Last match played' : undefined}
                  multi={multi}
                  onOpen={onOpenMatch}
                />
              )}
            </div>
          )}
          {season && (
            <div className={clsx(utils.card, shared.panel)}>
              <SeasonSection season={season} onOpen={onOpenMatch} onSeason={onSeason} />
              {seasons.length > 1 && <CareerSection seasons={seasons} onSeason={onSeason} />}
              {titles.length > 0 && <TitlesSection titles={titles} multi={multi} />}
            </div>
          )}
        </div>
        {side && (
          <div className={clsx(utils.card, shared.panel)}>
            {trend && <RankTrend history={history} loading={historyLoading} onResults={onResults} />}
            {rivals.length > 0 && <RivalsSection rows={rivals} />}
            {partners.length > 1 && <PartnersSection rows={partners} />}
            <ProfileSection bio={bio} />
            <MediaTeaser playerId={playerId} matches={matches} onOpen={onMedia} />
          </div>
        )}
      </div>
    );
  },
);

const MatchReplay = memo<{ pm: PlayerMatch }>(({ pm }) => {
  const item = useMatchReplays(pm.tournament).get(pm.match.id);
  return item ? <WatchButton item={item} size="sm" className={classes.watch} /> : null;
});

const MatchCard = memo<{
  pm: PlayerMatch;
  kind: MatchKind;
  label?: string;
  multi: boolean;
  onOpen: (pm: PlayerMatch) => void;
}>(({ pm, kind, label, multi, onOpen }) => {
  const open = useCallback(() => onOpen(pm), [onOpen, pm]);
  const { match, tournament: t } = pm;
  const seed = kind === 'last' ? null : ownTeam(pm).seed;
  return (
    <article className={clsx(kind === 'last' ? utils.card : utils.live, classes.match)} data-kind={kind}>
      <CardHit label={`Open match details · ${t.shortTitle}`} onClick={open} />
      <header className={shared.head}>
        <span className={shared.label}>
          {kind === 'live' && <LiveDot pulse />}
          {label ?? MATCH_LABELS[kind]}
        </span>
        <span className={clsx(shared.sub, classes.when)}>
          {kind === 'last' && (pm.outcome === 'W' ? 'Won' : 'Lost')}
          {match.date && <span>{formatDayMonth(match.date)}</span>}
          {kind === 'next' && <OutcomeLabel pm={pm} zone />}
        </span>
      </header>
      <div className={classes.matchTour}>
        <LogoTile src={t.logo} name={t.name} size={36} />
        <span className={shared.rowMain}>
          <span className={clsx(utils.ellipsis, classes.tourName)}>
            {seed ? `Seed ${seed} · ${t.shortTitle}` : t.shortTitle}
          </span>
          <span className={shared.rowMeta}>
            {roundName(match.round)}
            {multi && <span>{EVENT_NAMES[match.event]}</span>}
          </span>
        </span>
        {kind === 'last' && <MatchReplay pm={pm} />}
      </div>
      <div className={classes.matchBody}>
        <span className={shared.sub}>vs</span>
        <TeamPlayers players={opponentsOf(pm)} flag="sm" className={classes.opps} />
        {kind === 'last' && <ScoreChips match={match} side={pm.side} size="sm" />}
      </div>
    </article>
  );
});

const SeasonSection = memo<{
  season: SeasonView;
  onOpen: (pm: PlayerMatch) => void;
  onSeason: (year: number) => void;
}>(({ season, onOpen, onSeason }) => {
  const form = useMemo(() => recentForm(season.matches, RECENT_LIMIT), [season.matches]);
  const items = useMemo(
    () => form.map((pm) => ({ key: pm.key, outcome: formOutcome(pm), tip: formTip(pm), onClick: () => onOpen(pm) })),
    [form, onOpen],
  );
  const played = useMemo(() => tournamentsOf(season), [season]);
  const breakdown = useMemo(() => seasonBreakdown(season), [season]);
  const openSeason = useCallback(() => onSeason(season.year), [onSeason, season.year]);
  const { deciders } = breakdown;
  return (
    <Section
      label={season.year === SEASON_YEAR ? `${season.year} season` : `Last season played · ${season.year}`}
      aside={
        <button type="button" className={shared.link} onClick={openSeason}>
          All {season.year} matches
        </button>
      }
    >
      <div className={classes.stats}>
        <div className={classes.stat}>
          <span className={shared.sub}>Record</span>
          <span className={shared.value}>
            {season.wins}–{season.losses}
          </span>
          <span className={shared.track} style={shareVars(winShare(season.wins, season.losses) ?? 0, 1)} />
        </div>
        <Stat label="Win rate" value={winRate(season.wins, season.losses)} />
        <Stat label="Tournaments" value={played} />
        <Stat label="Deciding games" value={`${deciders.wins}–${deciders.losses}`} />
        <div className={classes.stat}>
          <span className={shared.sub}>Best run</span>
          <span className={shared.value}>
            <ResultText result={season.best} />
          </span>
        </div>
      </div>
      {breakdown.levels.length > 0 && (
        <div className={classes.line}>
          {breakdown.levels.map((l) => (
            <span key={l.level} className={shared.sub}>
              <LevelDot level={l.level} />
              {l.level === 'Finals' ? 'Finals' : `S${l.level}`}{' '}
              <b>
                {l.wins}–{l.losses}
              </b>
            </span>
          ))}
          {breakdown.avgMin > 0 && (
            <span className={shared.sub}>
              avg <Duration min={breakdown.avgMin} />
            </span>
          )}
        </div>
      )}
      {items.length > 0 && (
        <div className={classes.form}>
          <span className={shared.label}>
            {season.year} form · last {items.length}
          </span>
          <FormStrip items={items} variant="tile" />
          <span className={classes.formFoot}>Oldest → newest · tap for match</span>
        </div>
      )}
    </Section>
  );
});

const Stat = memo<{ label: string; value: number | string }>(({ label, value }) => (
  <div className={classes.stat}>
    <span className={shared.sub}>{label}</span>
    <span className={shared.value}>{value}</span>
  </div>
));

const CareerSection = memo<{ seasons: SeasonView[]; onSeason: (year: number) => void }>(({ seasons, onSeason }) => {
  const ordered = useMemo(() => seasons.toReversed(), [seasons]);
  return (
    <Section label="Season by season">
      <div className={classes.seasons}>
        {ordered.map((s) => (
          <SeasonColumn key={s.year} season={s} onSeason={onSeason} />
        ))}
      </div>
    </Section>
  );
});

const SeasonColumn = memo<{ season: SeasonView; onSeason: (year: number) => void }>(({ season: s, onSeason }) => {
  const open = useCallback(() => onSeason(s.year), [onSeason, s.year]);
  return (
    <button
      type="button"
      className={classes.season}
      onClick={open}
      aria-label={`See ${s.year} matches, ${s.wins}–${s.losses}`}
    >
      <span className={classes.seasonRate}>{winRate(s.wins, s.losses)}</span>
      <span className={classes.bar} style={shareVars(winShare(s.wins, s.losses) ?? 0, 1, 4)} />
      <span className={classes.seasonYear}>{s.year}</span>
    </button>
  );
});

const TitlesSection = memo<{ titles: PlayerMatch[]; multi: boolean }>(({ titles, multi }) => {
  const [all, { open: showAll }] = useDisclosure(false);
  const hidden = all ? 0 : Math.max(0, titles.length - TITLE_LIMIT);
  const shown = hidden ? titles.slice(0, TITLE_LIMIT) : titles;
  return (
    <Section label="Titles">
      <div className={shared.columns}>
        {shown.map((pm) => (
          <TitleRow key={pm.key} pm={pm} multi={multi} />
        ))}
      </div>
      {hidden > 0 && <MoreButton count={hidden} onClick={showAll} />}
    </Section>
  );
});

const TitleRow = memo<{ pm: PlayerMatch; multi: boolean }>(({ pm, multi }) => {
  const t = pm.tournament;
  return (
    <div className={shared.row} data-lead>
      <LogoTile src={t.logo} name={t.name} size={28} />
      <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={clsx(shared.rowTitle, classes.link)}>
        <span className={utils.ellipsis}>{t.shortTitle}</span>
      </Link>
      <span className={shared.rowSide}>
        {multi && <span>{pm.match.event}</span>}
        <LevelBadge level={t.level} size="sm" />
        <b>{t.year}</b>
      </span>
    </div>
  );
});
