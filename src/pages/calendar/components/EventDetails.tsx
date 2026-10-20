import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link, useNavigate } from '@tanstack/react-router';
import { memo, useCallback, useMemo } from 'react';

import { FollowRow } from '~/components/match';
import {
  LevelBadge,
  LogoTile,
  PodiumLink,
  TournamentPlace,
  TournamentStatusBadge,
  WinnersList,
} from '~/components/tournament';
import { IconNext, IconStarFilled } from '~/components/ui';
import { useSchedule } from '~/hooks/useTournaments';
import { useFavoritesMatcher } from '~/stores/favorites';
import type { Match, Tournament } from '~/types';
import { teamPlayers } from '~/utils/matches';
import { hasWinners, isLive, tournamentLink, tournamentParams } from '~/utils/tournaments';

import classes from './EventDetails.module.css';
import utils from '~/styles/utils.module.css';

const FOLLOW_LIMIT = 4;

const MORE_FOLLOWED = msg({
  message: '{count, plural, one {# more followed match} other {# more followed matches}}',
  comment:
    'Link under the followed matches in a tournament’s popover in the calendar season strip: how many more there are today. Opens the tournament’s matches filtered to followed players',
});

const liveFirst = (a: Match, b: Match) => Number(b.status === 'P') - Number(a.status === 'P');

const FollowingToday = memo<{ tournament: Tournament }>(({ tournament: t }) => {
  const { i18n } = useLingui();
  const { data: schedule } = useSchedule(t);
  const matcher = useFavoritesMatcher();
  const navigate = useNavigate();
  const matches = useMemo(
    () =>
      (schedule?.days[schedule.todayIndex]?.matches ?? [])
        .filter((m) => m.status !== 'F' && matcher(teamPlayers(m)))
        .sort(liveFirst),
    [schedule, matcher],
  );
  const open = useCallback(
    (match: string) => void navigate({ ...tournamentLink(t), search: { tab: 'matches', match } }),
    [navigate, t],
  );
  if (!matches.length) return null;
  const more = matches.length - FOLLOW_LIMIT;
  return (
    <div className={classes.following}>
      <span className={classes.followHead}>
        <IconStarFilled size={13} className={classes.star} />
        <Trans comment="Heading in a live tournament’s popover in the calendar season strip: today’s remaining matches of the players and countries the visitor follows">
          Following today
        </Trans>
      </span>
      {matches.slice(0, FOLLOW_LIMIT).map((m) => (
        <FollowRow key={m.id} match={m} onOpen={open} compact />
      ))}
      {more > 0 && (
        <Link {...tournamentLink(t)} search={{ tab: 'matches', following: true }} className={classes.more}>
          {i18n._({ ...MORE_FOLLOWED, values: { count: more } })}
        </Link>
      )}
    </div>
  );
});

export const EventDetails = memo<{ tournament: Tournament }>(({ tournament: t }) => {
  return (
    <>
      <div className={classes.top}>
        <span className={utils.num}>{t.dates}</span>
        <LevelBadge level={t.level} size="sm" />
      </div>
      <div className={classes.identity}>
        <LogoTile src={t.logo} name={t.name} size={52} flat />
        <div className={classes.info}>
          <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={classes.title}>
            {t.title}
          </Link>
          <div className={classes.meta}>
            <TournamentPlace tournament={t} />
            <span className={classes.sep}>·</span>
            <span className={utils.num}>{t.prizeLabel}</span>
          </div>
        </div>
      </div>
      {hasWinners(t) && (
        <>
          <WinnersList champions={t.champions} bordered />
          <PodiumLink tournament={t} />
        </>
      )}
      {t.status !== 'done' && <TournamentStatusBadge tournament={t} variant="line" className={classes.status} />}
      {isLive(t) && <FollowingToday tournament={t} />}
      <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={classes.go}>
        <Trans comment="Link at the bottom of a tournament’s popover in the calendar season strip">
          Go to tournament
        </Trans>
        <IconNext size={14} />
      </Link>
    </>
  );
});
