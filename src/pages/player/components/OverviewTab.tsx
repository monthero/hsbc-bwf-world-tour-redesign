import type { I18n, MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type ReactNode } from 'react';

import { EventTag, FormStrip, OutcomeLabel, ScoreChips, TeamPlayers } from '~/components/match';
import { WatchButton } from '~/components/media';
import { LevelBadge, LogoTile } from '~/components/tournament';
import { CardHit, Duration, EmptyState, LiveDot, MoreButton } from '~/components/ui';
import { SEASON_YEAR } from '~/constants';
import { useMatchReplays } from '~/hooks/useTournamentMedia';
import type { BioView, PlayerMatch } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { formatRecord } from '~/utils/format';
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
  recordEdge,
  rivalsOf,
  seasonBreakdown,
  shareVars,
  tournamentsOf,
  winRate,
  winShare,
} from '../utils';
import { MediaTeaser } from './MediaTab';
import { LevelDot, ResultText, Section, SplitColumns } from './parts';
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

const MATCH_LABELS: Record<MatchKind, MessageDescriptor> = {
  live: msg({ message: 'Live now', comment: 'Player overview card title: the match the player is playing right now' }),
  next: msg({
    message: 'Up next',
    context: 'player',
    comment: 'Player overview card title: the player’s next scheduled match',
  }),
  last: msg({ message: 'Last match', comment: 'Player overview card title: the player’s most recent finished match' }),
};
const FINALS_LEVEL = (
  <Trans
    context="level"
    comment="Tournament tier: the HSBC BWF World Tour Finals, shown next to the record at that tier (other tiers show as S1000, S750…)"
  >
    Finals
  </Trans>
);
const LAST_PLAYED = (
  <Trans comment="Player overview card title for a retired player: the final match of their career">
    Last match played
  </Trans>
);
const RIVAL_REPEAT_MIN = 3;
const RIVAL_LIMIT = 5;

const WON = <Trans comment="Outcome of the player’s last match: they won it">Won</Trans>;
const LOST = <Trans comment="Outcome of the player’s last match: they lost it">Lost</Trans>;

const formOutcome = (pm: PlayerMatch): 'W' | 'L' => (pm.outcome === 'W' ? 'W' : 'L');

const formTip = (i18n: I18n, pm: PlayerMatch) => {
  const opponents = opponentsOf(pm)
    .map((p) => p.name)
    .join(' / ');
  const tournament = pm.tournament.shortTitle;
  return pm.outcome === 'W'
    ? i18n._(
        msg({
          message: `Won vs ${opponents} · ${tournament}`,
          comment: 'Tooltip on a recent-form tile: match won against these opponents at this tournament',
        }),
      )
    : i18n._(
        msg({
          message: `Lost vs ${opponents} · ${tournament}`,
          comment: 'Tooltip on a recent-form tile: match lost against these opponents at this tournament',
        }),
      );
};

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
          {ready && !season && (
            <EmptyState>
              <Trans>No World Tour matches on record since 2018.</Trans>
            </EmptyState>
          )}
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
                  label={retired ? LAST_PLAYED : undefined}
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
            <ProfileSection bio={bio} />
            {trend && <RankTrend history={history} loading={historyLoading} onResults={onResults} />}
            {rivals.length > 0 && <RivalsSection rows={rivals} />}
            {partners.length > 1 && <PartnersSection rows={partners} />}
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
  label?: ReactNode;
  multi: boolean;
  onOpen: (pm: PlayerMatch) => void;
}>(({ pm, kind, label, multi, onOpen }) => {
  const { t, i18n } = useLingui();
  const open = useCallback(() => onOpen(pm), [onOpen, pm]);
  const { match, tournament: tour } = pm;
  const seed = kind === 'last' ? null : ownTeam(pm).seed;
  const tournament = tour.shortTitle;
  return (
    <article className={clsx(kind === 'last' ? utils.card : utils.live, classes.match)} data-kind={kind}>
      <CardHit
        label={t({
          message: `Open match details · ${tournament}`,
          comment: 'Accessible label for a match card: opens the match details for this tournament',
        })}
        onClick={open}
      />
      <header className={shared.head}>
        <span className={shared.label}>
          {kind === 'live' && <LiveDot pulse />}
          {label ?? i18n._(MATCH_LABELS[kind])}
        </span>
        <span className={clsx(shared.sub, classes.when)}>
          {kind === 'last' && (pm.outcome === 'W' ? WON : LOST)}
          {match.date && <span>{formatDayMonth(match.date)}</span>}
          {kind === 'next' && <OutcomeLabel pm={pm} zone />}
        </span>
      </header>
      <div className={classes.matchTour}>
        <LogoTile src={tour.logo} name={tour.name} size={36} />
        <span className={shared.rowMain}>
          <span className={clsx(utils.ellipsis, classes.tourName)}>
            {seed ? (
              <Trans comment="Seed is the player’s seeding number in the tournament draw, followed by the tournament name">
                Seed {seed} · {tournament}
              </Trans>
            ) : (
              tournament
            )}
          </span>
          <span className={shared.rowMeta}>
            {roundName(match.round)}
            {multi && <EventTag event={match.event} />}
          </span>
        </span>
        {kind === 'last' && <MatchReplay pm={pm} />}
      </div>
      <div className={classes.matchBody}>
        <span className={shared.sub}>
          <Trans comment="Short for versus, shown before the opponents’ names">vs</Trans>
        </span>
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
  const { t, i18n } = useLingui();
  const form = useMemo(() => recentForm(season.matches, RECENT_LIMIT), [season.matches]);
  const items = useMemo(
    () =>
      form.map((pm) => ({ key: pm.key, outcome: formOutcome(pm), tip: formTip(i18n, pm), onClick: () => onOpen(pm) })),
    [form, onOpen, i18n],
  );
  const played = useMemo(() => tournamentsOf(season), [season]);
  const breakdown = useMemo(() => seasonBreakdown(season), [season]);
  const openSeason = useCallback(() => onSeason(season.year), [onSeason, season.year]);
  const { deciders } = breakdown;
  const { year } = season;
  const count = items.length;
  return (
    <Section
      label={
        year === SEASON_YEAR ? (
          <Trans comment="Section title: the player’s stats for the current season">{year} season</Trans>
        ) : (
          <Trans comment="Section title: the player’s stats for the most recent season they played">
            Last season played · {year}
          </Trans>
        )
      }
      aside={
        <button type="button" className={shared.link} onClick={openSeason}>
          <Trans comment="Link to the Matches tab for this season">All {year} matches</Trans>
        </button>
      }
    >
      <div className={classes.stats}>
        <div className={classes.stat}>
          <span className={shared.sub}>
            <Trans comment="Season stat: matches won–lost, e.g. 24–7">Record</Trans>
          </span>
          <span className={clsx(shared.value, shared.edge)} data-edge={recordEdge(season.wins, season.losses)}>
            {formatRecord(season.wins, season.losses)}
          </span>
          <span className={shared.track} style={shareVars(winShare(season.wins, season.losses) ?? 0, 1)} />
        </div>
        <Stat
          label={t({ message: 'Win rate', comment: 'Stat label: share of matches won, as a percentage' })}
          value={winRate(season.wins, season.losses)}
        />
        <Stat
          label={t({ message: 'Tournaments', comment: 'Season stat: number of tournaments played' })}
          value={played}
        />
        <Stat
          label={t({
            message: 'Deciding games',
            comment:
              'Season stat: won–lost record in matches that went to a third, deciding game (badminton matches are best of three games)',
          })}
          value={formatRecord(deciders.wins, deciders.losses)}
          edge={recordEdge(deciders.wins, deciders.losses)}
        />
        <div className={classes.stat}>
          <span className={shared.sub}>
            <Trans comment="Season stat: the furthest the player got in any tournament this season, e.g. Winner or Semi-final">
              Best run
            </Trans>
          </span>
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
              {l.level === 'Finals' ? FINALS_LEVEL : `S${l.level}`}{' '}
              <b className={shared.edge} data-edge={recordEdge(l.wins, l.losses)}>
                {formatRecord(l.wins, l.losses)}
              </b>
            </span>
          ))}
          {breakdown.avgMin > 0 && (
            <span className={shared.sub}>
              <Trans comment="Average match duration this season; avg = average">
                avg <Duration min={breakdown.avgMin} />
              </Trans>
            </span>
          )}
        </div>
      )}
      {items.length > 0 && (
        <div className={classes.form}>
          <span className={shared.label}>
            <Trans comment="Heading of the recent-form strip: Form means the player’s recent results, shown as the last N matches won or lost">
              {year} form · last {count}
            </Trans>
          </span>
          <FormStrip items={items} variant="tile" />
          <span className={classes.formFoot}>
            <Trans comment="Hint under the recent-form strip: tiles run from oldest to newest match; tap one to open it">
              Oldest → newest · tap for match
            </Trans>
          </span>
        </div>
      )}
    </Section>
  );
});

const Stat = memo<{ label: string; value: number | string; edge?: string }>(({ label, value, edge }) => (
  <div className={classes.stat}>
    <span className={shared.sub}>{label}</span>
    <span className={clsx(shared.value, edge && shared.edge)} data-edge={edge}>
      {value}
    </span>
  </div>
));

const CareerSection = memo<{ seasons: SeasonView[]; onSeason: (year: number) => void }>(({ seasons, onSeason }) => {
  const ordered = useMemo(() => seasons.toReversed(), [seasons]);
  return (
    <Section
      label={<Trans comment="Section title: win rate for each season of the player’s career">Season by season</Trans>}
    >
      <div className={classes.seasons}>
        {ordered.map((s) => (
          <SeasonColumn key={s.year} season={s} onSeason={onSeason} />
        ))}
      </div>
    </Section>
  );
});

const SeasonColumn = memo<{ season: SeasonView; onSeason: (year: number) => void }>(({ season: s, onSeason }) => {
  const { t } = useLingui();
  const open = useCallback(() => onSeason(s.year), [onSeason, s.year]);
  const { year } = s;
  const record = formatRecord(s.wins, s.losses);
  return (
    <button
      type="button"
      className={classes.season}
      onClick={open}
      aria-label={t({
        message: `See ${year} matches, ${record}`,
        comment: 'Accessible label for a season bar: open that season’s matches; record is won–lost, e.g. 24–7',
      })}
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
    <Section label={<Trans comment="Section title: tournaments the player has won">Titles</Trans>}>
      <SplitColumns>
        {shown.map((pm) => (
          <TitleRow key={pm.key} pm={pm} multi={multi} />
        ))}
      </SplitColumns>
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
        <span className={clsx(utils.ellipsis, utils.bidiAuto)}>{t.shortTitle}</span>
      </Link>
      <span className={shared.rowSide}>
        {multi && <span>{pm.match.event}</span>}
        <LevelBadge level={t.level} size="sm" />
        <b>{t.year}</b>
      </span>
    </div>
  );
});
