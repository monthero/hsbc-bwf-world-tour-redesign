import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type FC, type ReactNode, type Ref } from 'react';

import { PlayerFollow } from '~/components/follow';
import { PlayerAvatar } from '~/components/player/PlayerAvatar';
import { RankSeed } from '~/components/player/RankMarks';
import { Medal } from '~/components/tournament/Medal';
import {
  COURT_VIEWBOX,
  CourtLines,
  IconEye,
  IconCheck,
  IconClose,
  IconTrophy,
  ShuttleIcon,
  StatusChip,
  Tip,
} from '~/components/ui';
import { DARK_SCOPE_PROPS } from '~/theme';
import type { Game, Player, Side } from '~/types';
import { CHALLENGE_LABELS, LONGEST_RUN, RALLY_POINTS, type CallKind, type ChallengeOutcome } from '~/utils/live';
import { noteLabel, noteTip } from '~/utils/matches';

import { ChallengeStocks } from '../ChallengeStocks';
import { GameChips } from '../GameChips';
import { ScheduledStart } from '../MatchTime';
import { SideMedal } from '../MedalMark';
import type { MedalStake } from '../medals';
import { ReceiveMark, ServeMark } from '../ServeMark';
import { StreakMark } from '../StreakMark';
import { TeamPlayers } from '../TeamPlayers';
import { trailsIn, type ShowdownView, type SideView } from './liveView';

import classes from './Showdown.module.css';
import utils from '~/styles/utils.module.css';

const SHUTTLE = <ShuttleIcon />;

const CHALLENGE_ICONS: Record<ChallengeOutcome | 'review', ReactNode> = {
  review: <IconEye />,
  won: <IconCheck />,
  lost: <IconClose />,
};

const CALL_ICONS: Record<CallKind, ReactNode> = { game: SHUTTLE, match: <IconTrophy /> };

const UNDER_REVIEW = msg({
  message: 'Under review',
  comment:
    'Live score banner with a camera icon: a player challenged a line call and the video review (Instant Review) is in progress. Keep it short',
});

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
      <Pill tone="review" icon={CHALLENGE_ICONS.review}>
        {i18n._(UNDER_REVIEW)}
      </Pill>
    );
  if (!s.recent) return null;
  return (
    <Pill tone={s.recent} icon={CHALLENGE_ICONS[s.recent]}>
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
        <Pill tone={kind} icon={CALL_ICONS[kind]}>
          {s.call}
        </Pill>
      )}
    </span>
  );
});

const Follows = memo<{ players: readonly Player[] }>(({ players }) => (
  <span className={classes.follow} data-pair={players.length > 1 || undefined}>
    {players.map((p) => (
      <span key={p.id || p.name} className={classes.followCell}>
        {p.id && <PlayerFollow player={p} name={p.name} variant="glass" box="sm" iconSize={14} />}
      </span>
    ))}
  </span>
));

type AfterPlayer = (p: Player) => ReactNode;

const SoloPlate = memo<{
  player: Player;
  side: Side;
  mark?: AfterPlayer;
}>(({ player, side, mark }) => {
  const players = useMemo(() => [player], [player]);
  return (
    <span className={classes.splitCell}>
      <TeamPlayers
        players={players}
        flag="sm"
        align={side ? 'end' : 'start'}
        after={mark}
        className={classes.names}
        nameClassName={classes.name}
      />
    </span>
  );
});

const Corner = memo<{ view: ShowdownView; side: Side; follow?: boolean }>(({ view: v, side, follow }) => {
  const s = v.live.sides[side];
  const { players } = s.team;
  const pair = players.length > 1 || undefined;
  const play = v.phase === 'play';
  const serving = play && s.serving;
  const solo = !pair && players.at(0)?.id;
  const server = v.live.server ?? (serving ? solo : undefined);
  const receiver = pair && v.live.receiver;
  const after = useCallback(
    (p: Player) => {
      if (p.id === server) return <ServeMark size={16} className={utils.raise} />;
      return p.id === receiver && <ReceiveMark size={16} className={utils.raise} />;
    },
    [server, receiver],
  );
  const teamServe = serving && !server;
  return (
    <div className={classes.corner} data-side={side} data-out={(v.winner !== null && v.winner !== side) || undefined}>
      <span className={classes.portrait} data-pair={pair}>
        {players.map((p) => (
          <PlayerAvatar key={p.id || p.name} player={p} className={classes.photo} />
        ))}
      </span>
      <span className={classes.split} data-pair={pair}>
        {players.map((p) => (
          <SoloPlate key={p.id || p.name} player={p} side={side} mark={server || receiver ? after : undefined} />
        ))}
      </span>
      {follow && <Follows players={players} />}
      <div className={classes.plate}>
        <RankSeed players={players} seed={s.team.seed} event={v.match.event} className={classes.plateMarks} />
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

const hasTags = (s: SideView) => (!!s.stats && s.left !== null) || !!s.result || s.streak > 0;

const Tags = memo<{ side: SideView }>(({ side: s }) => (
  <span className={classes.tags} data-side={s.side}>
    <ChallengeStocks stats={s.stats} left={s.left} mirror={s.side === 1} />
    {s.result && <StatusChip tone="green">{s.result}</StatusChip>}
    {s.streak > 0 && <StreakMark n={s.streak} mirror={s.side === 1} />}
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

export const StakePill = memo<{ stake: MedalStake }>(({ stake }) => (
  <Tip label={stake.tip}>
    <p className={clsx(utils.raise, classes.pill, classes.stake)}>
      <Medal kind={stake.kind} size={16} />
      <span aria-hidden>{stake.text}</span>
      <VisuallyHidden>{stake.tip}</VisuallyHidden>
    </p>
  </Tip>
));

export const ShowdownCard = memo<{
  view: ShowdownView;
  label: string;
  follow?: boolean;
  totals?: boolean;
  className?: string;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}>(({ view: v, label, follow, totals = true, className, ref, children }) => {
  const { i18n } = useLingui();
  const [a, b] = v.live.sides;
  const duels = totals && (v.phase === 'play' || v.phase === 'between');
  return (
    <section
      ref={ref}
      {...DARK_SCOPE_PROPS}
      className={clsx(classes.root, className)}
      data-live={v.onCourt || undefined}
      aria-label={label}
    >
      {children}
      <div className={classes.stage}>
        {BACKDROP}
        <Corner view={v} side={0} follow={follow} />
        <Hub view={v} />
        <Corner view={v} side={1} follow={follow} />
        <span className={classes.shade} aria-hidden />
        <GameChips games={v.done} className={classes.rail} />
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
