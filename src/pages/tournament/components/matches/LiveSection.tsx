import { Tooltip } from '@mantine/core';
import { clamp } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { memo, type CSSProperties, type FC, type ReactNode } from 'react';

import { liveMatchStatsQuery } from '~/api/queries';
import { TeamPlayers } from '~/components/match';
import { AvatarGroup } from '~/components/player';
import { CardHit, IconFire, LiveDot, SectionTitle } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { Match, Side } from '~/types';
import { formatDuration, plural } from '~/utils/format';
import {
  gameShare,
  pointCall,
  shareOf,
  type ChallengeOutcome,
  type ChallengeResult,
  type LiveStats,
} from '~/utils/live';
import { allGames, matchRoundName } from '~/utils/matches';

import { ShuttleIcon } from './ShuttleIcon';
import { matchTitle } from './utils';

import classes from './LiveSection.module.css';
import utils from '~/styles/utils.module.css';

const LIVE_ICON = <LiveDot pulse size={8} />;
const STREAK_MIN = 3;
const CHALLENGE_SHOW_MS = 60_000;
const AVATAR_SIZE = 48;

const CHALLENGE_LABELS: Record<ChallengeOutcome, string> = {
  won: 'Challenge won',
  lost: 'Challenge lost',
  void: 'Challenge · no decision',
};

const useLiveStats = (tmtId: number | null, m: Match) => {
  const q = useQuery({ ...liveMatchStatsQuery(tmtId ?? 0, m.code ?? ''), enabled: !!tmtId && !!m.code });
  const challenge = q.data?.challenge;
  return {
    stats: q.data ?? null,
    challenge: challenge && q.dataUpdatedAt - challenge.at < CHALLENGE_SHOW_MS ? challenge : null,
  };
};

const Serve: FC<{ on: boolean }> = ({ on }) => {
  return (
    <span className={classes.serve}>
      {on && (
        <Tooltip label="Serving">
          <span className={clsx(utils.raise, classes.serveIcon)}>
            <ShuttleIcon />
          </span>
        </Tooltip>
      )}
    </span>
  );
};

const LiveTeam: FC<{ match: Match; side: Side; stats: LiveStats | null; challenge: ChallengeResult | null }> = ({
  match: m,
  side,
  stats,
  challenge,
}) => {
  const team = m.teams[side];
  const call = pointCall(m, side);
  const streak = stats?.streak?.side === side && stats.streak.count >= STREAK_MIN ? stats.streak.count : 0;
  return (
    <div className={classes.team} data-side={side}>
      <AvatarGroup players={team.players} size={AVATAR_SIZE} className={classes.avatars} />
      <TeamPlayers
        players={team.players}
        seed={team.seed}
        flag="md"
        align={side ? 'end' : 'start'}
        className={classes.players}
      />
      <span className={classes.tags}>
        {call && (
          <span className={classes.tag} data-kind="point">
            {call}
          </span>
        )}
        {streak > 0 && (
          <span className={classes.tag} data-kind="streak">
            <IconFire size={12} />
            {streak} in a row
          </span>
        )}
        {challenge?.side === side && (
          <span className={classes.tag} data-kind={challenge.outcome}>
            {CHALLENGE_LABELS[challenge.outcome]}
          </span>
        )}
      </span>
    </div>
  );
};

const LiveScore: FC<{ match: Match }> = ({ match: m }) => {
  const [a, b] = m.current ?? [0, 0];
  return (
    <div className={classes.score}>
      <Serve on={m.serve === 1} />
      <span key={`a${a}`} className={classes.points} data-flash={m.lastPoint === 1 || undefined}>
        {a}
      </span>
      <span className={classes.dash}>–</span>
      <span key={`b${b}`} className={classes.points} data-flash={m.lastPoint === 2 || undefined}>
        {b}
      </span>
      <Serve on={m.serve === 2} />
    </div>
  );
};

const StatRow: FC<{ left: ReactNode; right: ReactNode; label: string; share?: number; tip?: string }> = ({
  left,
  right,
  label,
  share,
  tip,
}) => {
  const lead = share === undefined || share === 0.5 ? undefined : share > 0.5;
  return (
    <>
      <span className={classes.statValue} data-lead={lead === true || undefined}>
        {left}
      </span>
      <Tooltip label={tip} disabled={!tip}>
        <span className={classes.statMid} data-tip={tip ? true : undefined}>
          {label}
          {share !== undefined && (
            <span className={classes.bar} style={{ '--share': share } as CSSProperties}>
              <span />
            </span>
          )}
        </span>
      </Tooltip>
      <span className={classes.statValue} data-lead={lead === false || undefined}>
        {right}
      </span>
    </>
  );
};

const challengeTip = (s: LiveStats['sides'][number]) =>
  `${plural(s.challenges.used, 'challenge')} used · ${s.challenges.won} won · ${s.challenges.lost} lost`;

const LiveStatsGrid: FC<{ match: Match; stats: LiveStats | null }> = ({ match: m, stats }) => {
  const games = allGames(m);
  const [a, b] = stats?.sides ?? [];
  return (
    <div className={classes.stats}>
      {games.map((g, i) => (
        <StatRow
          key={i}
          left={g[0]}
          right={g[1]}
          label={i === games.length - 1 && m.current ? `Game ${i + 1} · now` : `Game ${i + 1}`}
          share={gameShare(g)}
        />
      ))}
      {a && b && (
        <>
          <StatRow
            left={a.ralliesWon}
            right={b.ralliesWon}
            label="Rallies won"
            share={shareOf(a.ralliesWon, b.ralliesWon)}
          />
          <StatRow left={a.longestRun} right={b.longestRun} label="Longest run" />
          <StatRow
            left={a.challenges.used}
            right={b.challenges.used}
            label="Challenges used"
            tip={`${challengeTip(a)} — ${challengeTip(b)}`}
          />
        </>
      )}
    </div>
  );
};

const LiveCard = memo<{ match: Match; tmtId: number | null; onOpen: (id: string) => void }>(
  ({ match: m, tmtId, onOpen }) => {
    const { stats, challenge } = useLiveStats(tmtId, m);
    return (
      <div className={clsx(utils.live, classes.card)}>
        <CardHit label={`Live match details: ${matchTitle(m)}`} onClick={() => onOpen(m.id)} />
        <div className={classes.head}>
          <span className={classes.where}>
            <span className={classes.court}>Court {m.court}</span>
            <span className={utils.ellipsis}>
              {EVENT_NAMES[m.event]} · {matchRoundName(m)}
            </span>
          </span>
          <span className={classes.headEnd}>
            {m.pause && <span className={classes.pause}>{m.pause}</span>}
            <span className={classes.elapsed}>{formatDuration(m.durationMin)}</span>
          </span>
        </div>
        <div className={classes.board}>
          <LiveTeam match={m} side={0} stats={stats} challenge={challenge} />
          <LiveScore match={m} />
          <LiveTeam match={m} side={1} stats={stats} challenge={challenge} />
        </div>
        <LiveStatsGrid match={m} stats={stats} />
      </div>
    );
  },
);

export const LiveSection = memo<{
  matches: Match[];
  tmtId: number | null;
  onOpen: (id: string) => void;
}>(({ matches, tmtId, onOpen }) => {
  const n = matches.length;
  return (
    <section className={classes.root}>
      <SectionTitle icon={LIVE_ICON} count={`${plural(n, 'match', 'matches')} on court`}>
        Live now
      </SectionTitle>
      <div
        className={clsx(utils.snapRow, utils.noScrollbar, classes.grid)}
        data-single={n === 1 || undefined}
        style={{ '--cols': clamp(n, 2, 3) } as CSSProperties}
      >
        {matches.map((m) => (
          <LiveCard key={m.id} match={m} tmtId={tmtId} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
});
