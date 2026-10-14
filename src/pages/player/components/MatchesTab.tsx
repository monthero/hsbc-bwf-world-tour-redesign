import { Skeleton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { ScoreChips, TeamPlayers } from '~/components/match';
import { Partner } from '~/components/player';
import { LevelBadge, LogoTile } from '~/components/tournament';
import { CardHit, EmptyState, Segmented, TipSpan, type SegmentedOption } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { PlayerMatch } from '~/types';
import { formatDayMonth } from '~/utils/dates';
import { plural } from '~/utils/format';
import { roundName } from '~/utils/matches';
import { centerChild, scrollBehavior } from '~/utils/scroll';
import { opponentsOf } from '~/utils/season';
import { tournamentParams } from '~/utils/tournaments';

import type { EventRun, SeasonView, TournamentRuns } from '../types';
import { eventsOf, teammateOf, tournamentRuns, tournamentsOf, winRate } from '../utils';
import { Outcome, ResultText } from './parts';

import classes from './MatchesTab.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface MatchesProps {
  playerId: string;
  seasons: SeasonView[];
  season: number | undefined;
  ready: boolean;
  onSeason: (year: number) => void;
  onOpenMatch: (pm: PlayerMatch) => void;
}

const sharedPartners = (groups: readonly TournamentRuns[]) => {
  const byEvent = new Map<string, Set<string>>();
  for (const run of groups.flatMap((g) => g.runs)) {
    if (!run.partner) continue;
    const set = byEvent.get(run.event) ?? new Set<string>();
    set.add(run.partner.id || run.partner.name);
    byEvent.set(run.event, set);
  }
  return new Set([...byEvent].filter(([, set]) => set.size > 1).map(([ev]) => ev));
};

export const MatchesTab = memo<MatchesProps>(({ playerId, seasons, season, ready, onSeason, onOpenMatch }) => {
  const current = seasons.find((s) => s.year === season) ?? seasons[0];
  const groups = useMemo(() => (current ? tournamentRuns(current.matches, playerId) : []), [current, playerId]);
  const mixed = useMemo(() => !!current && eventsOf(current.matches).length > 1, [current]);
  const varied = useMemo(() => sharedPartners(groups), [groups]);
  const played = useMemo(() => (current ? tournamentsOf(current) : 0), [current]);
  if (!ready) return <Skeleton height={520} radius={18} />;
  if (!current) return <EmptyState>No World Tour matches on record.</EmptyState>;
  return (
    <div className={classes.tab}>
      <div className={classes.bar}>
        {seasons.length > 1 && <SeasonPicker seasons={seasons} year={current.year} onSeason={onSeason} />}
        <span className={shared.sub}>
          <b>
            {current.wins}–{current.losses}
          </b>{' '}
          · {winRate(current.wins, current.losses)} · {plural(played, 'tournament')}
        </span>
      </div>
      <div className={clsx(utils.card, shared.section)}>
        <div className={shared.columns}>
          {groups.map((g) => (
            <TournamentGroup key={g.key} group={g} self={playerId} mixed={mixed} varied={varied} onOpen={onOpenMatch} />
          ))}
        </div>
      </div>
    </div>
  );
});

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
    useEffect(() => {
      const el = ref.current;
      const on = el?.querySelectorAll<HTMLElement>('button')[index];
      if (el && on) centerChild(el, on, scrollBehavior());
    }, [index]);
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
  varied: ReadonlySet<string>;
  onOpen: (pm: PlayerMatch) => void;
}>(({ group, self, mixed, varied, onOpen }) => {
  const t = group.tournament;
  const single = group.runs.length === 1 ? group.runs[0] : undefined;
  return (
    <div className={classes.group}>
      <div className={classes.groupHead}>
        <LogoTile src={t.logo} name={t.name} size={32} />
        <span className={shared.rowMain}>
          <Link to="/world-tour/$year/$slug" params={tournamentParams(t)} className={classes.tour}>
            {t.shortTitle}
          </Link>
          <span className={shared.rowMeta}>
            <LevelBadge level={t.level} size="sm" />
            <span>{t.dates}</span>
          </span>
        </span>
        {single && <ResultText result={single.result} />}
      </div>
      {group.runs.map((run) => (
        <RunView
          key={run.key}
          run={run}
          self={self}
          head={!single || mixed || (!!run.partner && varied.has(run.event))}
          result={!single}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
});

const RunView = memo<{
  run: EventRun;
  self: string;
  head: boolean;
  result: boolean;
  onOpen: (pm: PlayerMatch) => void;
}>(({ run, self, head, result, onOpen }) => (
  <div className={shared.rows}>
    {head && (
      <div className={classes.runHead}>
        <span className={shared.rowMeta}>
          <span>{EVENT_NAMES[run.event]}</span>
          {run.partner && <Partner player={run.partner} />}
        </span>
        {result && <ResultText result={run.result} />}
      </div>
    )}
    {run.matches.map((pm) => (
      <MatchRow key={pm.key} pm={pm} self={run.perMatch ? self : undefined} onOpen={onOpen} />
    ))}
  </div>
));

const MatchRow = memo<{ pm: PlayerMatch; self: string | undefined; onOpen: (pm: PlayerMatch) => void }>(
  ({ pm, self, onOpen }) => {
    const { match } = pm;
    const open = useCallback(() => onOpen(pm), [onOpen, pm]);
    const partner = self === undefined ? null : teammateOf(pm, self);
    return (
      <div className={shared.row} data-lead>
        <CardHit label={`Open match details · ${roundName(match.round)}`} onClick={open} />
        <TipSpan className={classes.round} tip={roundName(match.round)}>
          {match.round}
        </TipSpan>
        <span className={shared.rowMain}>
          <TeamPlayers players={opponentsOf(pm)} flag="xs" className={shared.rowNames} />
          <span className={shared.rowMeta}>
            {match.date && <span>{formatDayMonth(match.date)}</span>}
            {partner && <Partner player={partner} short />}
          </span>
        </span>
        <span className={shared.rowSide}>
          <ScoreChips match={match} side={pm.side} size="sm" />
          <Outcome pm={pm} />
        </span>
      </div>
    );
  },
);
