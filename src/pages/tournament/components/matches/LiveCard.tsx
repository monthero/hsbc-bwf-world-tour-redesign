import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useMemo, type CSSProperties, type FC, type Ref } from 'react';

import type { MediaItem } from '~/api/schemas';
import { FollowMark } from '~/components/follow';
import {
  ChallengeStocks,
  EventTag,
  medalStake,
  RoundTag,
  ServeMark,
  StreakMark,
  TeamPlayers,
} from '~/components/match';
import { WatchButton } from '~/components/media';
import { RankSeed, TeamPhoto } from '~/components/player';
import { CardHit, Duration, StatusChip, type StatusTone } from '~/components/ui';
import type { EventCode, Game, Match, Player, Side } from '~/types';
import { CHALLENGE_LABELS, CHALLENGE_REVIEW, GAME_SHORT, LONGEST_RUN, type ChallengeOutcome } from '~/utils/live';
import { gameWon, matchTitle } from '~/utils/matches';

import type { LiveView, SideView } from './liveView';

import classes from './LiveCard.module.css';
import utils from '~/styles/utils.module.css';

const CHALLENGE_TONES: Record<ChallengeOutcome, StatusTone> = { won: 'green', lost: 'red' };

const Tags: FC<{ side: SideView }> = ({ side: s }) => {
  const { i18n } = useLingui();
  const review = i18n._(CHALLENGE_REVIEW);
  return (
    <span className={classes.tags}>
      <ChallengeStocks stats={s.stats} left={s.left} />
      {s.result && <StatusChip tone="green">{s.result}</StatusChip>}
      {s.call && <StatusChip tone="gold">{s.call}</StatusChip>}
      {s.streak > 0 && <StreakMark n={s.streak} />}
      {s.review && <StatusChip tone="blue">{review}</StatusChip>}
      {s.recent && <StatusChip tone={CHALLENGE_TONES[s.recent]}>{CHALLENGE_LABELS[s.recent]}</StatusChip>}
    </span>
  );
};

const GameScore: FC<{ game: Game; side: Side }> = ({ game, side }) => (
  <span className={classes.prev} data-won={gameWon(game, side) || undefined}>
    {game[side]}
  </span>
);

const followMark = (p: Player) => <FollowMark player={p} />;

const TeamRow: FC<{ view: LiveView; side: SideView; event: EventCode }> = ({ view: v, side: s, event }) => {
  return (
    <div className={classes.row} data-lead={s.leading || undefined}>
      <div className={classes.team} data-side={s.side}>
        <TeamPhoto players={s.team.players} className={classes.photo} />
        <RankSeed players={s.team.players} seed={s.team.seed} event={event} className={classes.rank} />
        <TeamPlayers players={s.team.players} flag="sm" mark={followMark} className={classes.names} />
        <Tags side={s} />
      </div>
      <span className={classes.serveCell}>{s.serving && <ServeMark size={15} className={utils.raise} />}</span>
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

const GameHead: FC<{ n: number; className: string | undefined }> = ({ n, className }) => {
  const { i18n } = useLingui();
  return <span className={className}>{i18n._({ ...GAME_SHORT, values: { n } })}</span>;
};

const FootStat: FC<{ label: string; a: number; b: number }> = ({ label, a, b }) => (
  <span className={classes.foot}>
    {label}
    <span className={clsx(classes.footValues, utils.ltr)}>
      <span data-lead={a > b || undefined}>{a}</span>
      <span>–</span>
      <span data-lead={b > a || undefined}>{b}</span>
    </span>
  </span>
);

export const LiveCard = memo<{
  match: Match;
  view: LiveView;
  stream?: MediaItem;
  onOpen: (id: string) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}>(({ match: m, view: v, stream, onOpen, className, ref }) => {
  const { t, i18n } = useLingui();
  const [a, b] = v.sides;
  const runs = !!a.stats && !!b.stats;
  const { court, gameNo } = v;
  const title = matchTitle(m);
  const cols = useMemo(
    () =>
      ({
        '--cols': `minmax(0, 1fr) auto ${'var(--prev-w) '.repeat(v.games.length)}var(--now-w)`,
      }) as CSSProperties,
    [v.games.length],
  );
  return (
    <div
      ref={ref}
      className={clsx(utils.live, classes.card, className)}
      data-medal={!!medalStake(m.round) || undefined}
    >
      <CardHit
        label={t({
          message: `Live match details: ${title}`,
          comment: 'Accessible name of a live score card that opens the match details. {title} names the players',
        })}
        onClick={() => onOpen(m.id)}
      />
      <div className={classes.head}>
        <span className={classes.where}>
          <span className={classes.court}>
            <Trans comment="The court a match is played on, e.g. “Court 2”">Court {court}</Trans>
          </span>
          <span className={classes.what}>
            <EventTag event={m.event} />
            <RoundTag match={m} />
          </span>
        </span>
        <span className={classes.headEnd}>
          {v.status && <StatusChip tone={v.status.tone}>{v.status.label}</StatusChip>}
          <Duration min={v.durationMin} />
        </span>
      </div>
      <div className={classes.board} style={cols}>
        <div className={classes.row} data-head>
          <span />
          <span />
          {v.games.map((_, i) => (
            <GameHead key={i} n={i + 1} className={classes.colHead} />
          ))}
          <GameHead n={gameNo} className={classes.nowHead} />
        </div>
        <TeamRow view={v} side={a} event={m.event} />
        <TeamRow view={v} side={b} event={m.event} />
      </div>
      {(runs || stream) && (
        <div className={classes.footer}>
          {a.stats && b.stats && <FootStat label={i18n._(LONGEST_RUN)} a={a.stats.longestRun} b={b.stats.longestRun} />}
          {stream && <WatchButton item={stream} className={classes.watch} />}
        </div>
      )}
    </div>
  );
});
