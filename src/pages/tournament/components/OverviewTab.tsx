import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type FC, type ReactNode } from 'react';

import { MatchTime, TeamLabel } from '~/components/match';
import { LevelBadge, TournamentPlace } from '~/components/tournament';
import { CardHit, EmptyState, IconCalendar, IconMapPin, IconStarFilled, SectionTitle } from '~/components/ui';
import { DRAW_SIZE, EVENT_NAMES, QUALIFY_SPOTS } from '~/constants';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import { useSeries } from '~/hooks/useTournaments';
import { FOLLOW_KINDS, useFavoriteCount, useFavoritesMatcher } from '~/stores/favorites';
import type { Match, TournamentDay } from '~/types';
import { teamPlayers } from '~/utils/matches';
import { mapsUrl } from '~/utils/tournaments';

import { FOLLOW_EMPTY, FOLLOW_HINT } from '../constants';
import { useOpenMatch } from '../hooks';
import type { TabProps } from '../types';
import { buildPastWinners, type PastYear } from '../utils';
import { Champions, ChampionStrip } from './Champions';
import { matchTitle } from './matches/utils';

import page from '../TournamentPage.module.css';
import classes from './OverviewTab.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/world-tour/$year/$slug');

const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => {
  return (
    <div className={classes.row}>
      <span className={classes.rowLabel}>{label}</span>
      {children}
    </div>
  );
};

const DayRow = memo<{
  day: TournamentDay;
  past: boolean;
  disabled: boolean;
  onOpen: (index: number) => void;
}>(({ day, past, disabled, onOpen }) => {
  return (
    <button
      type="button"
      className={classes.day}
      data-today={day.isToday || undefined}
      data-past={past || undefined}
      data-rest={day.isRest || undefined}
      disabled={disabled || day.isRest}
      onClick={() => onOpen(day.index)}
    >
      <span className={classes.dayLabel}>
        <span className={classes.long}>
          {day.weekdayLong}, {day.dayNum} {day.monthLong}
        </span>
        <span className={classes.short}>
          {day.weekday}, {day.dayNum} {day.month}
        </span>
      </span>
      <span className={classes.dayRound}>
        <span className={utils.ellipsis}>{day.roundsLabel}</span>
        {day.isToday && <span className={classes.today}>Today</span>}
      </span>
      <span className={classes.dayCount}>{day.count || ''}</span>
    </button>
  );
});

const FollowRow = memo<{ match: Match; onOpen: (id: string) => void }>(({ match: m, onOpen }) => {
  const live = m.status === 'P';
  return (
    <div className={classes.follow}>
      <CardHit label={`Match details: ${matchTitle(m)}`} onClick={() => onOpen(m.id)} />
      <span className={classes.followTime} data-live={live || undefined}>
        <MatchTime match={m} stacked />
      </span>
      <span className={classes.followBody}>
        <span className={utils.ellipsis}>
          <TeamLabel players={m.teams[0].players} sep=" & " /> vs <TeamLabel players={m.teams[1].players} sep=" & " />
        </span>
        <span className={classes.followMeta}>
          {live && 'Live now · '}Court {m.court} · {EVENT_NAMES[m.event]}
        </span>
      </span>
    </div>
  );
});

const PastYearBlock = memo<{ year: PastYear }>(({ year }) => {
  return (
    <div className={classes.year}>
      <div className={classes.yearHead}>
        <span className={classes.yearNum}>{year.year}</span>
        <span className={classes.yearMeta}>{year.meta}</span>
      </div>
      <ChampionStrip items={year.items} past />
    </div>
  );
});

export const OverviewTab: FC<TabProps> = ({ tournament: t, schedule }) => {
  const navigate = route.useNavigate();
  const openMatch = useOpenMatch();
  const matcher = useFavoritesMatcher();
  const followed = useFavoriteCount(FOLLOW_KINDS);
  const { data: series } = useSeries(t.series);
  const { data: dir } = usePlayerDirectory();

  const following = useMemo(
    () =>
      (schedule.days[schedule.todayIndex]?.matches ?? []).filter((m) => m.status !== 'F' && matcher(teamPlayers(m))),
    [schedule, matcher],
  );
  const past = useMemo(() => (series ? buildPastWinners(t, series, dir) : []), [t, series, dir]);

  const openDay = useCallback(
    (day: number) => navigate({ search: (s) => ({ ...s, tab: 'matches', day }), replace: true, resetScroll: false }),
    [navigate],
  );

  const hasMatches = schedule.matches.length > 0;

  return (
    <>
      <Champions schedule={schedule} />
      <section className={clsx(utils.container, page.tabSection, classes.overview)}>
        <div className={page.tabGrid}>
          <div className={clsx(utils.card, classes.details)}>
            <Row label="Dates">
              <span className={classes.value}>{t.datesLong}</span>
            </Row>
            {t.venue && (
              <Row label="Venue">
                <span className={classes.value}>{t.venue}</span>
              </Row>
            )}
            <Row label="City">
              <TournamentPlace tournament={t} className={classes.value} />
            </Row>
            <Row label="Level">
              <LevelBadge level={t.level} long />
            </Row>
            <Row label="Prize money">
              <span className={utils.num}>{t.prizeLabel}</span>
            </Row>
            <Row label="Location">
              <a href={mapsUrl(t)} target="_blank" rel="noopener noreferrer" className={classes.maps}>
                <IconMapPin size={15} />
                Open in Google Maps
              </a>
            </Row>
            <Row label="Draws">
              <span className={classes.value}>
                5 events · {t.level === 'Finals' ? QUALIFY_SPOTS : DRAW_SIZE} per draw
              </span>
            </Row>
          </div>

          <div className={clsx(utils.card, classes.card)}>
            <SectionTitle as="h3" icon={<IconCalendar size={15} />} className={classes.cardTitle}>
              Schedule
            </SectionTitle>
            {schedule.days.map((d) => (
              <DayRow
                key={d.index}
                day={d}
                past={schedule.todayIndex >= 0 && d.index < schedule.todayIndex && t.status === 'live'}
                disabled={!hasMatches}
                onOpen={openDay}
              />
            ))}
          </div>

          <div className={clsx(utils.card, classes.card)}>
            <SectionTitle
              as="h3"
              icon={<IconStarFilled size={15} className={classes.star} />}
              className={classes.cardTitle}
            >
              Following today
            </SectionTitle>
            {following.map((m) => (
              <FollowRow key={m.id} match={m} onOpen={openMatch} />
            ))}
            {!following.length && (
              <EmptyState variant="note" className={classes.followEmpty}>
                {followed ? FOLLOW_EMPTY : FOLLOW_HINT}
              </EmptyState>
            )}
          </div>
        </div>

        {past.length > 0 && (
          <div className={clsx(utils.card, classes.past)}>
            <SectionTitle>Past winners</SectionTitle>
            {past.map((y) => (
              <PastYearBlock key={y.key} year={y} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
