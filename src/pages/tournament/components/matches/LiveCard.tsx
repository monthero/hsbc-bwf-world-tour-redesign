import { Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type CSSProperties, type FC } from 'react';
import HandBold from '~icons/solar/user-hand-up-bold';

import type { LiveServer, MatchStats } from '~/api/bwf/normalize';
import type { MediaItem } from '~/api/schemas';
import { TeamPlayers } from '~/components/match';
import { WatchLive } from '~/components/media';
import { AvatarGroup } from '~/components/player';
import { CardHit, Duration, IconFire, ShuttleIcon, StatusChip, type StatusTone, InfoTip } from '~/components/ui';
import type { Game, Match, Player, Side } from '~/types';
import {
  CHALLENGE_LABELS,
  CHALLENGE_RULE,
  challengeHeadline,
  challengeRows,
  challengeTip,
  type ChallengeOutcome,
  type ChallengeResult,
  type LiveStats,
} from '~/utils/live';
import { gameWon } from '~/utils/matches';

import { toLiveView, type LiveView, type SideView } from './liveView';
import { matchTitle } from './utils';

import classes from './LiveCard.module.css';
import utils from '~/styles/utils.module.css';

const AVATAR = 34;
const FIRE = <IconFire size={12} />;

const CHALLENGE_TONES: Record<ChallengeOutcome, StatusTone> = { won: 'green', lost: 'red', void: 'silver' };

const Serve: FC<{ size?: number }> = ({ size = 15 }) => (
  <Tooltip label="Serving">
    <span className={clsx(utils.raise, classes.serve)} style={{ '--serve': `${size}px` } as CSSProperties}>
      <ShuttleIcon />
    </span>
  </Tooltip>
);

const ChallengeCount: FC<{ side: SideView }> = ({ side: { stats, left } }) => {
  if (!stats || left === null) return null;
  const tip = challengeTip(stats, left);
  const card = <InfoTip title={challengeHeadline(left)} subtitle={CHALLENGE_RULE} rows={challengeRows(stats)} inline />;
  return (
    <Tooltip label={card}>
      <span className={clsx(utils.raise, classes.challenge)} data-left={left} aria-label={tip}>
        <HandBold className={classes.challengeIcon} aria-hidden />
        {left}
      </span>
    </Tooltip>
  );
};

const Tags: FC<{ side: SideView }> = ({ side: s }) => (
  <span className={classes.tags}>
    <ChallengeCount side={s} />
    {s.result && <StatusChip tone="green">{s.result}</StatusChip>}
    {s.call && <StatusChip tone="gold">{s.call}</StatusChip>}
    {s.streak > 0 && (
      <StatusChip tone="red" icon={FIRE}>
        {s.streak} in a row
      </StatusChip>
    )}
    {s.review && <StatusChip tone="blue">Challenge · under review</StatusChip>}
    {s.recent && <StatusChip tone={CHALLENGE_TONES[s.recent]}>{CHALLENGE_LABELS[s.recent]}</StatusChip>}
  </span>
);

const GameScore: FC<{ game: Game; side: Side }> = ({ game, side }) => (
  <span className={classes.prev} data-won={gameWon(game, side) || undefined}>
    {game[side]}
  </span>
);

const TeamRow: FC<{ view: LiveView; side: SideView }> = ({ view: v, side: s }) => {
  const server = v.server;
  const after = useCallback((p: Player) => p.id === server && <Serve size={13} />, [server]);
  return (
    <div className={classes.row} data-lead={s.leading || undefined}>
      <div className={classes.team}>
        <AvatarGroup players={s.team.players} size={AVATAR} className={classes.avatars} />
        <div className={classes.who}>
          <TeamPlayers
            players={s.team.players}
            seed={s.team.seed}
            flag="sm"
            after={server ? after : undefined}
            className={classes.names}
          />
          <Tags side={s} />
        </div>
      </div>
      {!server && <span className={classes.serveCell}>{s.serving && <Serve />}</span>}
      {v.games.map((g, i) => (
        <GameScore key={i} game={g} side={s.side} />
      ))}
      <span className={classes.now}>
        <span key={s.now} className={classes.points} data-flash={s.flash || undefined}>
          {s.now}
        </span>
      </span>
    </div>
  );
};

const FootStat: FC<{ label: string; a: number; b: number }> = ({ label, a, b }) => (
  <span className={classes.foot}>
    {label}
    <span className={classes.footValues}>
      <span data-lead={a > b || undefined}>{a}</span>–<span data-lead={b > a || undefined}>{b}</span>
    </span>
  </span>
);

export const LiveCard = memo<{
  match: Match;
  stats: LiveStats | null;
  game: MatchStats | null;
  challenge: ChallengeResult | null;
  server?: LiveServer;
  stream?: MediaItem;
  onOpen: (id: string) => void;
  className?: string;
}>(({ match: m, stats, game, challenge, server, stream, onOpen, className }) => {
  const v = useMemo(() => toLiveView(m, stats, game, challenge, server), [m, stats, game, challenge, server]);
  const [a, b] = v.sides;
  const cols = useMemo(
    () =>
      ({
        '--cols': `minmax(0, 1fr) ${v.server ? '' : 'auto '}${'var(--prev-w) '.repeat(v.games.length)}var(--now-w)`,
      }) as CSSProperties,
    [v.server, v.games.length],
  );
  return (
    <div className={clsx(utils.live, classes.card, className)}>
      <CardHit label={`Live match details: ${matchTitle(m)}`} onClick={() => onOpen(m.id)} />
      <div className={classes.head}>
        <span className={classes.where}>
          <span className={classes.court}>Court {v.court}</span>
          <span className={utils.ellipsis}>{v.where}</span>
        </span>
        <span className={classes.headEnd}>
          {v.status && <StatusChip tone={v.status.tone}>{v.status.label}</StatusChip>}
          <Duration min={v.durationMin} />
        </span>
      </div>
      <div className={classes.board} style={cols}>
        <div className={classes.row} data-head>
          <span />
          {!v.server && <span />}
          {v.games.map((_, i) => (
            <span key={i} className={classes.colHead}>
              G{i + 1}
            </span>
          ))}
          <span className={classes.nowHead}>G{v.gameNo}</span>
        </div>
        <TeamRow view={v} side={a} />
        <TeamRow view={v} side={b} />
      </div>
      <div className={classes.footer}>
        <span className={classes.stats}>
          <FootStat label="Points" a={a.points} b={b.points} />
          {a.stats && b.stats && <FootStat label="Longest run" a={a.stats.longestRun} b={b.stats.longestRun} />}
        </span>
        {stream && <WatchLive item={stream} className={classes.watch} />}
      </div>
    </div>
  );
});
