import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type FC, type ReactNode } from 'react';

import type { MediaItem } from '~/api/schemas';
import { ChallengeStocks, ScheduledStart, ServeMark, SideMedal, StreakMark, TeamPlayers } from '~/components/match';
import { WatchButton } from '~/components/media';
import { PlayerAvatar } from '~/components/player';
import { Medal } from '~/components/tournament';
import { CardHit, COURT_VIEWBOX, CourtLines, Duration, IconHand, ShuttleIcon, StatusChip, Tip } from '~/components/ui';
import { useMatchStream } from '~/hooks/useTournamentMedia';
import { DARK_SCOPE_PROPS } from '~/theme';
import type { Game, Match, Player, Side, Tournament } from '~/types';
import { joinDots } from '~/utils/format';
import {
  CHALLENGE_LABELS,
  CHALLENGE_REVIEW,
  GAME_SHORT,
  gameDone,
  LONGEST_RUN,
  RALLY_POINTS,
  type CallKind,
} from '~/utils/live';
import { courtLabel, formatGames, gameWon, noteLabel, noteTip, opposite } from '~/utils/matches';

import { LiveHeadToHead } from './LiveHeadToHead';
import { toShowdownView, trailsIn, type ShowdownView, type SideView } from './liveView';
import { useLiveView } from './useLiveView';
import { detailsLabel, matchTitle } from './utils';

import classes from './Showdown.module.css';
import utils from '~/styles/utils.module.css';

const HAND = <IconHand />;
const SHUTTLE = <ShuttleIcon />;

const VS = msg({
  message: 'VS',
  comment:
    'Large “versus” mark between the two sides on the live score before a match starts and between games. Keep it very short',
});

const Pill: FC<{ tone: string; icon: ReactNode; children: ReactNode }> = ({ tone, icon, children }) => (
  <span className={clsx(classes.pill, classes.call)} data-tone={tone}>
    {icon}
    <span className={utils.ellipsis}>{children}</span>
  </span>
);

const ChallengePill: FC<{ side: SideView }> = ({ side: s }) => {
  const { i18n } = useLingui();
  if (s.review)
    return (
      <Pill tone="review" icon={HAND}>
        {i18n._(CHALLENGE_REVIEW)}
      </Pill>
    );
  if (!s.recent) return null;
  return (
    <Pill tone={s.recent} icon={HAND}>
      {CHALLENGE_LABELS[s.recent]}
    </Pill>
  );
};

const Pills = memo<{ side: SideView; kind: CallKind | null }>(({ side: s, kind }) => {
  if (!s.review && !s.recent && !(s.call && kind)) return null;
  return (
    <span className={classes.pills}>
      <ChallengePill side={s} />
      {s.call && kind && (
        <Pill tone={kind} icon={SHUTTLE}>
          {s.call}
        </Pill>
      )}
    </span>
  );
});

const Corner = memo<{ view: ShowdownView; side: Side }>(({ view: v, side }) => {
  const s = v.live.sides[side];
  const server = v.live.server;
  const after = useCallback(
    (p: Player) => p.id === server && <ServeMark size={16} className={utils.raise} />,
    [server],
  );
  const teamServe = v.phase === 'play' && !server && s.serving;
  return (
    <div className={classes.corner} data-side={side} data-out={(v.winner !== null && v.winner !== side) || undefined}>
      <span className={classes.portrait} data-pair={s.team.players.length > 1 || undefined}>
        {s.team.players.map((p) => (
          <PlayerAvatar key={p.id || p.name} player={p} className={classes.photo} />
        ))}
      </span>
      <div className={classes.plate}>
        <TeamPlayers
          players={s.team.players}
          seed={s.team.seed}
          flag="sm"
          align={side ? 'end' : 'start'}
          after={server ? after : undefined}
          className={classes.names}
          nameClassName={classes.name}
        />
        {teamServe && <ServeMark size={16} className={utils.raise} />}
        <SideMedal match={v.match} side={side} size={22} className={utils.raise} />
      </div>
      <Pills side={s} kind={v.calls[side]} />
    </div>
  );
});

const Digit: FC<{ view: ShowdownView; score: Game; side: Side }> = ({ view: v, score, side }) => {
  const flash = v.phase === 'play' && v.live.sides[side].flash;
  return (
    <span
      className={classes.digit}
      data-side={side}
      data-dim={(v.phase !== 'play' && trailsIn(score, side)) || undefined}
    >
      <span key={score[side]} className={classes.punch} data-flash={flash || undefined}>
        {score[side]}
      </span>
    </span>
  );
};

const SEPARATOR = (
  <>
    <span className={classes.sep} aria-hidden>
      <ShuttleIcon />
    </span>
    <VisuallyHidden>–</VisuallyHidden>
  </>
);

const Mark: FC<{ view: ShowdownView }> = ({ view: v }) => {
  const { i18n } = useLingui();
  if (!v.note)
    return (
      <span key={v.phase} className={classes.vs}>
        {i18n._(VS)}
      </span>
    );
  return (
    <Tip label={noteTip(v.match)}>
      <span className={clsx(utils.raise, classes.vs)} data-note>
        {noteLabel(v.note, 'short')}
      </span>
    </Tip>
  );
};

const Hub = memo<{ view: ShowdownView }>(({ view: v }) => {
  const { score } = v;
  return (
    <div className={classes.hub}>
      {v.label && <span className={classes.hubLabel}>{v.label}</span>}
      {score ? (
        <span className={classes.now}>
          <Digit view={v} score={score} side={0} />
          {SEPARATOR}
          <Digit view={v} score={score} side={1} />
        </span>
      ) : (
        <Mark view={v} />
      )}
      {v.phase === 'pre' && !v.onCourt && (
        <ScheduledStart match={v.match} className={classes.start} timeClassName={classes.startTime} />
      )}
    </div>
  );
});

const GameChip = memo<{ n: number; game: Game }>(({ n, game }) => {
  const { i18n } = useLingui();
  const finished = gameDone(game);
  const lost = (side: Side) => !finished || gameWon(game, opposite(side)) || undefined;
  const label = i18n._({ ...GAME_SHORT, values: { n } });
  return (
    <li className={classes.game} aria-label={`${label} ${formatGames([game])}`}>
      <span className={classes.gameValue} data-lost={lost(0)} aria-hidden>
        {game[0]}
      </span>
      <span className={classes.gameNo} aria-hidden>
        {label}
      </span>
      <span className={classes.gameValue} data-side="1" data-lost={lost(1)} aria-hidden>
        {game[1]}
      </span>
    </li>
  );
});

const Rail = memo<{ games: readonly Game[] }>(({ games }) =>
  games.length ? (
    <ol className={classes.rail}>
      {games.map((g, i) => (
        <GameChip key={i} n={i + 1} game={g} />
      ))}
    </ol>
  ) : null,
);

const hasTags = (s: SideView) => (!!s.stats && s.left !== null) || !!s.result || s.streak > 0;

const Tags = memo<{ side: SideView }>(({ side: s }) => (
  <span className={classes.tags} data-side={s.side}>
    <ChallengeStocks stats={s.stats} left={s.left} />
    {s.result && <StatusChip tone="green">{s.result}</StatusChip>}
    {s.streak > 0 && <StreakMark n={s.streak} />}
  </span>
));

const Duel: FC<{ label: string; a: number; b: number }> = ({ label, a, b }) => (
  <span className={classes.duel}>
    <span className={classes.duelValue} data-lead={a >= b || undefined}>
      {a}
    </span>
    <span className={classes.duelLabel}>{label}</span>
    <span className={classes.duelValue} data-lead={b >= a || undefined}>
      {b}
    </span>
  </span>
);

const BACKDROP = (
  <div className={classes.backdrop} aria-hidden>
    <svg viewBox={COURT_VIEWBOX} className={classes.plane}>
      <CourtLines className={classes.lines} netClassName={classes.net} />
    </svg>
  </div>
);

export const Showdown = memo<{
  view: ShowdownView;
  stream?: MediaItem;
  onOpen: (id: string) => void;
  className?: string;
}>(({ view: v, stream, onOpen, className }) => {
  const { i18n } = useLingui();
  const m = v.match;
  const [a, b] = v.live.sides;
  const court = courtLabel(m.court);
  const open = useCallback(() => onOpen(m.id), [onOpen, m.id]);
  const duels = v.phase === 'play' || v.phase === 'between';
  return (
    <section
      {...DARK_SCOPE_PROPS}
      className={clsx(classes.root, className)}
      data-live={v.onCourt || undefined}
      aria-label={joinDots([v.live.event, v.live.round])}
    >
      <CardHit label={detailsLabel(matchTitle(m))} onClick={open} className={classes.hit} />
      <div className={classes.head}>
        <span className={classes.where}>
          {court && <span className={classes.court}>{court}</span>}
          <span className={utils.ellipsis}>{v.live.event}</span>
          <span aria-hidden>·</span>
          <span className={classes.round}>{v.live.round}</span>
        </span>
        <span className={classes.headEnd}>
          <Duration min={v.live.durationMin} className={utils.raise} />
          {stream && <WatchButton item={stream} />}
        </span>
      </div>
      {(v.status || v.stake) && (
        <div className={classes.lead}>
          {v.status && <StatusChip tone={v.status.tone}>{v.status.label}</StatusChip>}
          {v.stake && (
            <Tip label={v.stake.tip}>
              <p className={clsx(utils.raise, classes.pill, classes.stake)}>
                <Medal kind={v.stake.kind} size={16} />
                <span aria-hidden>{v.stake.text}</span>
                <VisuallyHidden>{v.stake.tip}</VisuallyHidden>
              </p>
            </Tip>
          )}
        </div>
      )}
      <div className={classes.stage}>
        {BACKDROP}
        <Corner view={v} side={0} />
        <Hub view={v} />
        <Corner view={v} side={1} />
        <Rail games={v.done} />
      </div>
      {(duels || hasTags(a) || hasTags(b)) && (
        <div className={classes.tagRow}>
          <Tags side={a} />
          {duels && (
            <span className={classes.stats}>
              <Duel label={i18n._(RALLY_POINTS)} a={a.points} b={b.points} />
              {a.stats && b.stats && <Duel label={i18n._(LONGEST_RUN)} a={a.stats.longestRun} b={b.stats.longestRun} />}
            </span>
          )}
          <Tags side={b} />
        </div>
      )}
    </section>
  );
});

export const MatchShowdown = memo<{
  match: Match;
  tournament: Tournament;
  replay?: MediaItem;
  h2h?: boolean;
  onOpen: (id: string) => void;
}>(({ match: m, tournament, replay, h2h, onOpen }) => {
  const live = useLiveView(tournament, m);
  const view = useMemo(() => toShowdownView(m, live), [m, live]);
  const stream = useMatchStream(tournament, m);
  return (
    <>
      <Showdown view={view} stream={replay ?? stream} onOpen={onOpen} />
      {h2h && (
        <div className={utils.container}>
          <LiveHeadToHead match={m} tournament={tournament} />
        </div>
      )}
    </>
  );
});
