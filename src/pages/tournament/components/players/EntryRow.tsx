import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { TeamFollow } from '~/components/follow';
import { EventTag, TeamPlayers, TimedStatus } from '~/components/match';
import { CardHit, Tip } from '~/components/ui';
import { formatRank } from '~/utils/format';
import { isScheduled, teamLabel } from '~/utils/matches';

import { entryStatus, type Entry, type LatestEntry } from './entries';

import classes from './Players.module.css';
import utils from '~/styles/utils.module.css';

export const EntryRank: FC<{ rank: number; className?: string }> = ({ rank, className }) =>
  rank > 0 ? (
    <Tip label="BWF World Ranking in this category">
      <span className={clsx(utils.raise, classes.rank, className)}>{formatRank(rank)}</span>
    </Tip>
  ) : null;

export const EntryStatus: FC<{ entry: LatestEntry; withStage?: boolean }> = ({ entry, withStage = true }) => {
  const status = entryStatus(entry);
  if (!entry.match && !withStage && !entry.qualifier) return null;
  return (
    <span className={classes.status} data-tone={status.tone}>
      {entry.qualifier && (
        <Tip label="Came through qualifying">
          <span className={clsx(utils.raise, classes.qualifier)}>Q</span>
        </Tip>
      )}
      {(entry.match || withStage) && <TimedStatus match={entry.match} tone={status.tone} label={status.label} />}
    </span>
  );
};

export const EntryRow = memo<{ entry: Entry; onOpen: (id: string) => void }>(({ entry, onOpen }) => {
  const { event, team, match, rank } = entry;

  return (
    <div className={classes.entry}>
      {match && isScheduled(match) && (
        <CardHit label={`Match details: ${teamLabel(team)}`} onClick={() => onOpen(match.id)} />
      )}
      <span className={classes.entryMeta}>
        <EventTag event={event} />
        <EntryRank rank={rank} />
      </span>
      <div className={classes.entryBody}>
        <TeamPlayers
          players={team.players}
          seed={team.seed}
          flag={false}
          end={<TeamFollow players={team.players} iconSize={15} />}
          nameClassName={classes.entryName}
        />
        <EntryStatus entry={entry} />
      </div>
    </div>
  );
});
