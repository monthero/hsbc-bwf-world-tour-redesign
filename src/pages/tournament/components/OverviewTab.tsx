import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type FC, type ReactNode } from 'react';

import { LiveMark, MatchTime, TeamLabel } from '~/components/match';
import { LevelBadge, TournamentPlace } from '~/components/tournament';
import {
  CardHit,
  EmptyState,
  IconCalendar,
  IconCoins,
  IconExternal,
  IconMapPin,
  IconStarFilled,
  SectionTitle,
  Tip,
} from '~/components/ui';
import { DRAW_SIZE, EVENT_NAMES, QUALIFY_SPOTS } from '~/constants';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import { useSeries } from '~/hooks/useTournaments';
import { FOLLOW_KINDS, useFavoriteCount, useFavoritesMatcher } from '~/stores/favorites';
import type { Match, Tournament, TournamentDay } from '~/types';
import { teamPlayers } from '~/utils/matches';
import { mapsUrl } from '~/utils/tournaments';

import { FOLLOW_EMPTY, FOLLOW_HINT, LIVE_NOW, PRIZE_MONEY } from '../constants';
import { useOpenMatch, useUpdateSearch } from '../hooks';
import type { TabProps } from '../types';
import { buildPastWinners, type PastYear } from '../utils';
import { Champions, ChampionStrip } from './Champions';
import { IconLabel } from './IconLabel';
import { detailsLabel, matchTitle } from './matches/utils';

import page from '../TournamentPage.module.css';
import classes from './OverviewTab.module.css';
import utils from '~/styles/utils.module.css';

const DATES_LABEL = msg({ message: 'Dates', comment: 'Tournament overview: label for the tournament dates' });
const DATES = <IconLabel icon={IconCalendar} label={DATES_LABEL} className={classes.lead} />;
const PRIZE = <IconLabel icon={IconCoins} label={PRIZE_MONEY} className={classes.lead} />;
const DRAWS = (
  <span className={classes.rowLabel}>
    <Trans comment="Tournament overview: label for the number of events and the size of each event’s draw (bracket)">
      Draws
    </Trans>
  </span>
);

const Row: FC<{ lead?: ReactNode; children: ReactNode }> = ({ lead, children }) => {
  return (
    <div className={classes.row}>
      {lead}
      {children}
    </div>
  );
};

const MapsLink: FC<{ tournament: Tournament }> = ({ tournament }) => {
  const { t } = useLingui();
  const label = t({ message: 'Open in Google Maps', comment: 'Link that shows the tournament venue on a map' });
  return (
    <Tip label={label}>
      <a
        href={mapsUrl(tournament)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={classes.maps}
      >
        <IconMapPin size={16} />
        <IconExternal size={10} />
      </a>
    </Tip>
  );
};

const DayRow = memo<{
  day: TournamentDay;
  past: boolean;
  disabled: boolean;
  onOpen: (index: number) => void;
}>(({ day, past, disabled, onOpen }) => {
  const { dayNum, weekdayLong, monthLong, weekday, month } = day;
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
          <Trans comment="Overview schedule row: full date, e.g. “Wednesday, 15 October”. Reorder the weekday, day number and month as your language writes dates">
            {weekdayLong}, {dayNum} {monthLong}
          </Trans>
        </span>
        <span className={classes.short}>
          <Trans comment="Overview schedule row on small screens: short date, e.g. “Wed, 15 Oct”. Reorder the weekday, day number and month as your language writes dates">
            {weekday}, {dayNum} {month}
          </Trans>
        </span>
      </span>
      <span className={classes.dayRound}>
        <span className={utils.ellipsis}>{day.roundsLabel}</span>
        {day.isToday && (
          <span className={classes.today}>
            <Trans comment="Badge on today’s row in the tournament schedule">Today</Trans>
          </span>
        )}
      </span>
      <span className={classes.dayCount}>{day.count || ''}</span>
    </button>
  );
});

const FollowRow = memo<{ match: Match; onOpen: (id: string) => void }>(({ match: m, onOpen }) => {
  const { i18n } = useLingui();
  const live = m.status === 'P';
  const home = <TeamLabel players={m.teams[0].players} sep=" & " />;
  const away = <TeamLabel players={m.teams[1].players} sep=" & " />;
  const { court } = m;
  const event = EVENT_NAMES[m.event];
  return (
    <div className={classes.follow}>
      <CardHit label={detailsLabel(matchTitle(m))} onClick={() => onOpen(m.id)} />
      <span className={classes.followTime} data-live={live || undefined}>
        <MatchTime match={m} stacked />
      </span>
      <span className={classes.followBody}>
        <span className={utils.ellipsis}>
          <Trans comment="The two sides of a match, e.g. “Axelsen vs Shi”">
            {home} vs {away}
          </Trans>
        </span>
        <span className={classes.followMeta}>
          {live && <LiveMark label={i18n._(LIVE_NOW)} size={6} />}
          <Trans comment="Where and what a followed match is: the court number and the event, e.g. “Court 2 · Men’s singles”">
            Court {court} · {event}
          </Trans>
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
  const { i18n } = useLingui();
  const update = useUpdateSearch();
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

  const openDay = useCallback((day: number) => update({ tab: 'matches', day }), [update]);

  const hasMatches = schedule.matches.length > 0;
  const size = t.level === 'Finals' ? QUALIFY_SPOTS : DRAW_SIZE;

  return (
    <>
      <Champions schedule={schedule} />
      <section className={clsx(utils.container, page.tabSection, classes.overview)}>
        <div className={page.tabGrid}>
          <div className={clsx(utils.card, classes.details)}>
            <Row lead={DATES}>
              <span className={classes.value}>{t.datesLong}</span>
            </Row>
            <Row lead={<MapsLink tournament={t} />}>
              <span className={classes.place}>
                <TournamentPlace tournament={t} />
                {t.venue && <span className={classes.venue}>{t.venue}</span>}
              </span>
            </Row>
            <Row>
              <LevelBadge level={t.level} long />
            </Row>
            <Row lead={PRIZE}>
              <span className={utils.num}>{t.prizeLabel}</span>
            </Row>
            <Row lead={DRAWS}>
              <span className={classes.value}>
                <Trans comment="Tournament overview: there are five events, and {size} players or pairs in each event’s draw">
                  5 events · {size} per draw
                </Trans>
              </span>
            </Row>
          </div>

          <div className={clsx(utils.card, classes.card)}>
            <SectionTitle as="h3" icon={<IconCalendar size={15} />} className={classes.cardTitle}>
              <Trans comment="Tournament overview card listing each day and its rounds">Schedule</Trans>
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
              <Trans comment="Tournament overview card: today’s remaining matches of the players and countries the visitor follows">
                Following today
              </Trans>
            </SectionTitle>
            {following.map((m) => (
              <FollowRow key={m.id} match={m} onOpen={openMatch} />
            ))}
            {!following.length && (
              <EmptyState variant="note" className={classes.followEmpty}>
                {i18n._(followed ? FOLLOW_EMPTY : FOLLOW_HINT)}
              </EmptyState>
            )}
          </div>
        </div>

        {past.length > 0 && (
          <div className={clsx(utils.card, classes.past)}>
            <SectionTitle>
              <Trans comment="Tournament overview: champions of earlier editions of this tournament">
                Past winners
              </Trans>
            </SectionTitle>
            {past.map((y) => (
              <PastYearBlock key={y.key} year={y} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
