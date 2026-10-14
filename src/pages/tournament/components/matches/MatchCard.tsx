import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { FollowedMark } from '~/components/follow';
import { EventTag, MatchTime, NoteTag, SideScores, TeamPlayers, type NoteTone } from '~/components/match';
import { CardHit, Duration, IconCheck } from '~/components/ui';
import { useMatchTime } from '~/hooks/useMatchClock';
import { useNow } from '~/hooks/useNow';
import type { Match, Player, Side } from '~/types';
import { nextLabel, type NextKind } from '~/utils/match-time';
import { isDoubles, noteLabel, noteTip, sideResult } from '~/utils/matches';

import { matchTitle } from './utils';

import classes from './MatchCard.module.css';
import utils from '~/styles/utils.module.css';

const NOTE_TONES: Partial<Record<string, NoteTone>> = { Walkover: 'sky', Retired: 'violet' };

const followedMark = (p: Player) => <FollowedMark id={p.id} />;

const TeamRow: FC<{ match: Match; side: Side; doubles: boolean }> = ({ match: m, side, doubles }) => {
  const result = sideResult(m, side);
  return (
    <div className={classes.team} data-result={result}>
      <div className={classes.who}>
        <TeamPlayers
          players={m.teams[side].players}
          seed={m.teams[side].seed}
          flag={doubles ? 'xs' : 'sm'}
          truncate
          after={followedMark}
          className={classes.players}
          nameClassName={classes.name}
        />
      </div>
      <IconCheck className={classes.check} />
      <SideScores match={m} side={side} />
    </div>
  );
};

const NextLabel = memo<{ match: Match; kind: NextKind }>(({ match, kind }) => {
  const start = useMatchTime(match);
  const now = useNow();
  return <span className={classes.next}>{start ? nextLabel(start, kind, now) : 'Next'}</span>;
});

export const MatchCard = memo<{
  match: Match;
  next?: NextKind;
  onOpen: (id: string) => void;
}>(({ match: m, next, onOpen }) => {
  const doubles = isDoubles(m.event);
  const done = m.status === 'F';
  const note = done ? noteLabel(m.note, 'short') : '';
  return (
    <div className={clsx(utils.card, classes.card)} data-interactive data-doubles={doubles || undefined}>
      <CardHit label={`Match details: ${matchTitle(m)}`} onClick={() => onOpen(m.id)} />
      <div className={classes.head}>
        <span className={classes.when}>
          <span className={classes.time} data-up={m.status === 'N' || undefined}>
            <MatchTime match={m} />
          </span>
          <span className={classes.court}>Court {m.court}</span>
        </span>
        <span className={classes.tags}>
          {next && <NextLabel match={m} kind={next} />}
          {done && <Duration min={m.durationMin} size={12} className={classes.meta} />}
          {note && <NoteTag label={note} tip={noteTip(m)} tone={NOTE_TONES[m.note ?? ''] ?? 'sky'} />}
          <EventTag event={m.event} />
        </span>
      </div>
      <div className={classes.teams}>
        <TeamRow match={m} side={0} doubles={doubles} />
        <TeamRow match={m} side={1} doubles={doubles} />
      </div>
    </div>
  );
});
