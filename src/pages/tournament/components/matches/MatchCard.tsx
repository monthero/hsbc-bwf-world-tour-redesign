import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import type { MediaItem } from '~/api/schemas';
import { FollowMark } from '~/components/follow';
import { EventTag, MatchTime, MedalMark, SideMedal, SideNote, SideScores, TeamPlayers } from '~/components/match';
import { WatchButton } from '~/components/media';
import { RankSeed } from '~/components/player';
import { CardHit, Duration, IconCheck } from '~/components/ui';
import { useMatchTime } from '~/hooks/useMatchClock';
import { useNow } from '~/hooks/useNow';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import type { Match, Player, PlayerDirectory, Side } from '~/types';
import { nextLabel, type NextKind } from '~/utils/match-time';
import { detailsLabel, isDoubles, matchTitle, sideResult } from '~/utils/matches';
import { worldRank } from '~/utils/rankings';

import classes from './MatchCard.module.css';
import utils from '~/styles/utils.module.css';

const followMark = (p: Player) => <FollowMark player={p} />;

const TeamRow: FC<{ match: Match; side: Side; dir: PlayerDirectory | undefined }> = ({ match: m, side, dir }) => {
  const result = sideResult(m, side);
  const { players, seed } = m.teams[side];
  return (
    <div className={classes.team} data-result={result}>
      <div className={classes.who}>
        <TeamPlayers
          players={players}
          flag="sm"
          truncate
          mark={followMark}
          badge={<RankSeed rank={worldRank(dir, players, m.event)} seed={seed} event={m.event} />}
          className={classes.players}
          nameClassName={classes.name}
        />
        <SideMedal match={m} side={side} size={17} className={utils.raise} />
        <SideNote match={m} side={side} className={clsx(utils.raise, classes.note)} />
      </div>
      <IconCheck className={classes.check} />
      <SideScores match={m} side={side} />
    </div>
  );
};

const NextLabel = memo<{ match: Match; kind: NextKind }>(({ match, kind }) => {
  const start = useMatchTime(match);
  const now = useNow();
  const label = start ? nextLabel(start, kind, now) : undefined;
  if (label === null) return null;
  return (
    <span className={classes.next}>
      {label ?? (
        <Trans context="court" comment="Match card tag: this is the next match on its court">
          Next
        </Trans>
      )}
    </span>
  );
});

export const MatchCard = memo<{
  match: Match;
  next?: NextKind;
  replay?: MediaItem;
  onOpen: (id: string) => void;
}>(({ match: m, next, replay, onOpen }) => {
  const { data: dir } = usePlayerDirectory();
  const doubles = isDoubles(m.event);
  const done = m.status === 'F';
  const { court } = m;
  return (
    <div className={clsx(utils.card, classes.card)} data-interactive data-doubles={doubles || undefined}>
      <CardHit label={detailsLabel(matchTitle(m))} onClick={() => onOpen(m.id)} />
      <div className={classes.head}>
        <span className={classes.when}>
          <span className={classes.time} data-up={m.status === 'N' || undefined}>
            <MatchTime match={m} />
          </span>
          <span className={classes.court}>
            <Trans comment="The court a match is played on, e.g. “Court 2”">Court {court}</Trans>
          </span>
        </span>
        <span className={classes.tags}>
          {next && <NextLabel match={m} kind={next} />}
          {done && <Duration min={m.durationMin} size={12} className={classes.meta} />}
          {!done && <MedalMark round={m.round} className={utils.raise} />}
          <EventTag event={m.event} />
        </span>
      </div>
      <div className={classes.teams}>
        <TeamRow match={m} side={0} dir={dir} />
        <TeamRow match={m} side={1} dir={dir} />
      </div>
      {replay && <WatchButton item={replay} size="strip" className={classes.replay} />}
    </div>
  );
});
