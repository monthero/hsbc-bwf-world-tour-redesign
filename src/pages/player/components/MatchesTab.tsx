import { Skeleton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { EventTag, OutcomeBadge, OutcomeLabel, ScoreChips, TeamPlayers } from '~/components/match';
import { Partner } from '~/components/player';
import { LogoTile } from '~/components/tournament';
import { CardHit, EmptyState, Segmented, SectionTitle, type SegmentedOption } from '~/components/ui';
import type { EventCode, PlayerMatch } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { roundName } from '~/utils/matches';
import { medalOfResult } from '~/utils/medals';
import { centerChild } from '~/utils/scroll';
import { opponentsOf } from '~/utils/season';
import { tournamentParams } from '~/utils/tournaments';

import type { EventRun, SeasonView, TournamentRuns } from '../types';
import { eventsOf, teammateOf, tournamentRuns } from '../utils';
import { EventPicker } from './EventPicker';
import { ResultPill } from './ResultPill';
import { SeasonRecord } from './SeasonRecord';

import classes from './MatchesTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

const ROW_SKELETON = [0, 1, 2, 3];

const centerOption = (el: HTMLDivElement | null, index: number) => {
  const on = el?.querySelectorAll<HTMLElement>('button')[index];
  if (el && on) centerChild(el, on, 'smooth');
};

const podium = (result: number | null): result is number => result !== null && !!medalOfResult(result);

interface MatchesTabProps {
  playerId: string;
  seasons: SeasonView[];
  events: readonly EventCode[];
  season: number | undefined;
  event: EventCode | undefined;
  ready: boolean;
  onSeason: (year: number) => void;
  onEvent: (event: EventCode | undefined) => void;
  onOpenMatch: (pm: PlayerMatch) => void;
}

export const MatchesTab = memo<MatchesTabProps>(
  ({ playerId, seasons, events, season, event, ready, onSeason, onEvent, onOpenMatch }) => {
    const current = seasons.find((s) => s.year === season) ?? seasons[0];
    const groups = useMemo(() => (current ? tournamentRuns(current.matches, playerId) : []), [current, playerId]);
    const mixed = useMemo(() => !!current && eventsOf(current.matches).length > 1, [current]);
    if (!ready)
      return (
        <div className={clsx(utils.card, shared.panel)}>
          {ROW_SKELETON.map((i) => (
            <Skeleton key={i} height={104} radius={12} />
          ))}
        </div>
      );
    if (!current) return <EmptyState>No World Tour matches on record.</EmptyState>;
    return (
      <div className={shared.stack}>
        {(events.length > 1 || seasons.length > 1) && (
          <div className={classes.filters}>
            {events.length > 1 && <EventPicker events={events} value={event} onChange={onEvent} />}
            {seasons.length > 1 && <SeasonPicker seasons={seasons} year={current.year} onSeason={onSeason} />}
          </div>
        )}
        <div className={clsx(utils.card, shared.panel)}>
          <SectionTitle count={groups.length} aside={<SeasonRecord season={current} />}>
            {seasons.length > 1 ? 'Tournaments' : `${current.year} tournaments`}
          </SectionTitle>
          {groups.map((g) => (
            <TournamentGroup key={g.key} group={g} self={playerId} mixed={mixed} onOpen={onOpenMatch} />
          ))}
        </div>
      </div>
    );
  },
);

const SeasonPicker = memo<{ seasons: SeasonView[]; year: number; onSeason: (year: number) => void }>(
  ({ seasons, year, onSeason }) => {
    const ref = useRef<HTMLDivElement>(null);
    const options = useMemo(
      (): SegmentedOption<string>[] => seasons.map((s) => ({ value: String(s.year), label: String(s.year) })),
      [seasons],
    );
    const index = seasons.findIndex((s) => s.year === year);
    const select = useCallback(
      (v: string | null) => {
        if (v) onSeason(Number(v));
      },
      [onSeason],
    );
    useEffect(() => centerOption(ref.current, index), [index]);
    return (
      <div ref={ref} className={clsx(utils.noScrollbar, classes.seasons)}>
        <Segmented className={classes.seasonSeg} options={options} value={String(year)} onChange={select} />
      </div>
    );
  },
);

const TournamentGroup = memo<{
  group: TournamentRuns;
  self: string;
  mixed: boolean;
  onOpen: (pm: PlayerMatch) => void;
}>(({ group, self, mixed, onOpen }) => {
  const t = group.tournament;
  const single = group.runs.length === 1 ? group.runs[0] : undefined;
  return (
    <div className={classes.group}>
      <div className={classes.groupHead}>
        <LogoTile src={t.logo} name={t.name} size={32} eager />
        <span className={classes.groupTitle}>
          <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={classes.tour}>
            {t.shortTitle}
          </Link>
          <span className={classes.stage}>
            {t.dates} · {t.levelLabel}
          </span>
          {single && <RunMeta run={single} mixed={mixed} />}
        </span>
        {single && podium(single.result) && <ResultPill result={single.result} />}
      </div>
      {group.runs.map((run) => (
        <RunView key={run.key} run={run} self={self} head={!single} onOpen={onOpen} />
      ))}
    </div>
  );
});

const RunMeta = memo<{ run: EventRun; mixed: boolean }>(({ run, mixed }) => {
  if (!mixed && !run.partner) return null;
  return (
    <span className={classes.meta}>
      {mixed && <EventTag event={run.event} />}
      {run.partner && <Partner player={run.partner} />}
    </span>
  );
});

const RunView = memo<{ run: EventRun; self: string; head: boolean; onOpen: (pm: PlayerMatch) => void }>(
  ({ run, self, head, onOpen }) => {
    return (
      <>
        {head && (
          <div className={classes.runHead}>
            <RunMeta run={run} mixed />
            {podium(run.result) && <ResultPill result={run.result} />}
          </div>
        )}
        {run.matches.map((pm) => (
          <MatchRow key={pm.key} pm={pm} self={run.perMatch ? self : undefined} onOpen={onOpen} />
        ))}
      </>
    );
  },
);

const MatchRow = memo<{ pm: PlayerMatch; self: string | undefined; onOpen: (pm: PlayerMatch) => void }>(
  ({ pm, self, onOpen }) => {
    const { match, tournament } = pm;
    const open = useCallback(() => onOpen(pm), [onOpen, pm]);
    const partner = self === undefined ? null : teammateOf(pm, self);
    return (
      <div className={clsx(utils.inset, classes.row)}>
        <CardHit label={`Open match details · ${tournament.shortTitle}`} onClick={open} />
        <div className={classes.head}>
          <span className={classes.round}>{roundName(match.round)}</span>
          {partner && <Partner player={partner} className={classes.rowPartner} />}
          <span className={clsx(utils.num, classes.date)}>{formatDayMonth(match.date)}</span>
        </div>
        <div className={classes.body}>
          <OutcomeBadge outcome={pm.outcome} label={<OutcomeLabel pm={pm} />} />
          <TeamPlayers players={opponentsOf(pm)} flag="xs" className={classes.opps} nameClassName={classes.oppName} />
          <ScoreChips match={match} side={pm.side} />
        </div>
      </div>
    );
  },
);
