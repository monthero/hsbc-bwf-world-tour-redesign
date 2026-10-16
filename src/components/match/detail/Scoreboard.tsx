import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo, type CSSProperties, type FC } from 'react';

import { liveServersQuery } from '~/api/queries';
import { PlayerFollow } from '~/components/follow';
import { PlayerAvatar } from '~/components/player/PlayerAvatar';
import { Duration, IconCheck, LiveDot, StatusChip } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Game, Match, Player, Side, Tournament } from '~/types';
import { gameDone, livePhase, liveStatus, pointCall, servingPlayer } from '~/utils/live';
import { allGames, gameWon, isDoubles, opposite, sideResult } from '~/utils/matches';

import { MatchNote } from '../EventTag';
import { MatchTime } from '../MatchTime';
import { ServeMark } from '../ServeMark';
import { TeamPlayers } from '../TeamPlayers';

import classes from './MatchDetail.module.css';

const AVATARS = { single: [44, 52], pair: [30, 34] } as const;
const SIDES: readonly Side[] = [0, 1];

const useServer = (t: Tournament, m: Match) => {
  const live = m.status === 'P';
  const { data } = useQuery({ ...liveServersQuery(t.tmtId ?? 0), enabled: live && !!t.tmtId && !!m.code });
  return live ? servingPlayer(m, m.code ? data?.[m.code] : undefined) : null;
};

const SideAvatar = memo<{ player: Player; size: number }>(({ player, size }) => (
  <span className={classes.avatar}>
    <PlayerAvatar player={player} size={size} link />
    {player.id && (
      <PlayerFollow
        player={player}
        name={player.name}
        variant="glass"
        box="xs"
        iconSize={11}
        className={classes.avatarStar}
      />
    )}
  </span>
));

const Status: FC<{ match: Match }> = ({ match: m }) => {
  if (m.status === 'P') {
    const chip = liveStatus(m);
    return (
      <>
        <span className={classes.sbLive}>
          <LiveDot pulse />
          <Trans context="match status" comment="Scoreboard status: the match is being played right now">
            Live
          </Trans>
        </span>
        {chip && <StatusChip tone={chip.tone}>{chip.label}</StatusChip>}
      </>
    );
  }
  if (m.status === 'F')
    return (
      <>
        <span className={classes.sbState}>
          <Trans context="match status" comment="Scoreboard status: the match has finished and this is the final score">
            Final
          </Trans>
        </span>
        <MatchNote match={m} form="long" />
      </>
    );
  return (
    <span className={classes.sbState}>
      {m.time ? (
        <>
          <Trans comment="Scoreboard status for a scheduled match: it starts at this time or later, e.g. “Not before 14:30”">
            Not before <MatchTime match={m} className={classes.sbTime} />
          </Trans>
        </>
      ) : (
        <Trans>Time to be announced</Trans>
      )}
    </span>
  );
};

const SideRow = memo<{
  match: Match;
  side: Side;
  games: readonly Game[];
  now: number;
  server: string | null;
  avatar: number;
}>(({ match: m, side, games, now, server, avatar }) => {
  const team = m.teams[side];
  const result = sideResult(m, side);
  const live = result === 'live';
  const serving = live && !server && livePhase(m) === 'play' && m.serve === side + 1;
  const call = live ? pointCall(m, side) : null;
  const leading = !!m.current && m.current[side] > m.current[opposite(side)];
  const before = useCallback((p: Player) => <SideAvatar player={p} size={avatar} />, [avatar]);
  const after = useCallback((p: Player) => p.id === server && <ServeMark />, [server]);
  const { t } = useLingui();
  let aside = null;
  if (serving) aside = <ServeMark />;
  else if (result === 'won')
    aside = (
      <IconCheck
        className={classes.check}
        aria-label={t({
          message: 'Winner',
          context: 'match',
          comment: 'Check mark beside the side that won the match',
        })}
      />
    );
  return (
    <div className={classes.sbRow} data-side={side} data-result={result} data-lead={leading || undefined}>
      <div className={classes.sbSide}>
        <TeamPlayers
          players={team.players}
          seed={team.seed}
          flag="sm"
          truncate
          before={before}
          after={server ? after : undefined}
          aside={aside}
          className={classes.sbNames}
          nameClassName={classes.sbName}
        />
        {call && (
          <span className={classes.sbTags}>
            <StatusChip tone="gold">{call}</StatusChip>
          </span>
        )}
      </div>
      {games.map((g, i) => (
        <span
          key={i}
          className={classes.sbGame}
          data-now={i === now || undefined}
          data-won={(i !== now && gameDone(g) && gameWon(g, side)) || undefined}
        >
          {g[side]}
        </span>
      ))}
    </div>
  );
});

export const Scoreboard = memo<{ match: Match; tournament: Tournament; className?: string }>(
  ({ match: m, tournament, className }) => {
    const mobile = useIsMobile();
    const server = useServer(tournament, m);
    const games = useMemo(() => allGames(m), [m]);
    const now = m.status === 'P' && m.current ? m.games.length : -1;
    const { t } = useLingui();
    const avatar = AVATARS[isDoubles(m.event) ? 'pair' : 'single'][mobile ? 0 : 1];
    const cols = useMemo(
      () =>
        ({
          '--cols': `minmax(0, 1fr) ${games.map((_, i) => (i === now ? 'var(--now-w)' : 'var(--g-w)')).join(' ')}`,
        }) as CSSProperties,
      [games, now],
    );
    return (
      <section
        className={className}
        aria-label={t({ message: 'Score', comment: 'Accessible name of the match scoreboard' })}
      >
        <div className={classes.sbHead}>
          <span className={classes.sbStatus}>
            <Status match={m} />
          </span>
          {m.status !== 'N' && <Duration min={m.durationMin} className={classes.sbDuration} />}
        </div>
        <div className={classes.board} style={cols}>
          {games.length > 0 && (
            <div className={classes.sbRow} data-head>
              <span />
              {games.map((_, i) => {
                const game = i + 1;
                return (
                  <span key={i} className={classes.sbColHead} data-now={i === now || undefined}>
                    {t({ message: `G${game}`, comment: 'Scoreboard column header: short for Game 1, Game 2, Game 3' })}
                  </span>
                );
              })}
            </div>
          )}
          {SIDES.map((s) => (
            <SideRow key={s} match={m} side={s} games={games} now={now} server={server} avatar={avatar} />
          ))}
        </div>
      </section>
    );
  },
);
