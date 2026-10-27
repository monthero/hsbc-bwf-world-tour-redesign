import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import type { MediaItem } from '~/api/schemas';
import { FollowMark } from '~/components/follow';
import { EventTag, MatchTime, MedalMark, SideMedal, SideNote, SideScores, TeamPlayers } from '~/components/match';
import { WatchButton } from '~/components/media';
import { RankSeed } from '~/components/player';
import { CardHit, Duration } from '~/components/ui';
import { useMatchTime } from '~/hooks/useMatchClock';
import { useNow } from '~/hooks/useNow';
import type { Match, Player, Side } from '~/types';
import { nextLabel, type NextKind } from '~/utils/match-time';
import { detailsLabel, isDoubles, matchTitle, sideResult } from '~/utils/matches';

import classes from './MatchCard.module.css';
import discipline from '~/styles/discipline.module.css';
import utils from '~/styles/utils.module.css';

const followMark = (p: Player) => <FollowMark player={p} />;

const TeamRow: FC<{ match: Match; side: Side }> = ({ match: m, side }) => {
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
          className={classes.players}
          nameClassName={classes.name}
        />
        <SideMedal match={m} side={side} size={17} className={utils.raise} />
        <SideNote match={m} side={side} className={clsx(utils.raise, classes.note)} />
      </div>
      <RankSeed players={players} seed={seed} event={m.event} className={classes.marks} />
      <SideScores match={m} side={side} className={classes.scores} />
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
  const doubles = isDoubles(m.event);
  const done = m.status === 'F';
  const { court } = m;
  return (
    <div
      className={clsx(utils.card, classes.card, discipline.tone)}
      data-event={m.event}
      data-interactive
      data-doubles={doubles || undefined}
    >
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
        <TeamRow match={m} side={0} />
        <TeamRow match={m} side={1} />
      </div>
      {replay && <WatchButton item={replay} size="strip" className={classes.replay} />}
    </div>
  );
});
