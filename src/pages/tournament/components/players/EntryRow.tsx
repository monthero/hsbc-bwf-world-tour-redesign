import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { TeamFollow } from '~/components/follow';
import { EventTag, TeamPlayers, TimedStatus } from '~/components/match';
import { CardHit, Tip } from '~/components/ui';
import { detailsLabel, isScheduled, teamLabel } from '~/utils/matches';

import { entryStatus, type Entry, type LatestEntry } from './entries';

import classes from './Players.module.css';
import utils from '~/styles/utils.module.css';

const QUALIFIER = (
  <Tip
    label={
      <Trans comment="Tooltip on the Q badge of a player or pair who won through the qualifying rounds">
        Came through qualifying
      </Trans>
    }
  >
    <span className={clsx(utils.raise, classes.qualifier)}>
      <Trans
        context="qualifier"
        comment="Badge on a player or pair who won through the qualifying rounds into the main draw (abbreviation of Qualifier)"
      >
        Q
      </Trans>
    </span>
  </Tip>
);

export const EntryStatus: FC<{ entry: LatestEntry; withStage?: boolean }> = ({ entry, withStage = true }) => {
  const status = entryStatus(entry);
  if (!entry.match && !withStage && !entry.qualifier) return null;
  return (
    <span className={classes.status} data-tone={status.tone}>
      {entry.qualifier && QUALIFIER}
      {(entry.match || withStage) && <TimedStatus match={entry.match} tone={status.tone} label={status.label} />}
    </span>
  );
};

export const EntryRow = memo<{ entry: Entry; onOpen: (id: string) => void }>(({ entry, onOpen }) => {
  const { event, team, match, rank } = entry;

  return (
    <div className={classes.entry}>
      {match && isScheduled(match) && (
        <CardHit label={detailsLabel(teamLabel(team))} onClick={() => onOpen(match.id)} />
      )}
      <EventTag event={event} className={classes.entryEvent} />
      <div className={classes.entryBody}>
        <TeamPlayers
          players={team.players}
          seed={team.seed}
          event={event}
          rank={rank}
          flag={false}
          end={<TeamFollow players={team.players} iconSize={15} />}
          nameClassName={classes.entryName}
        />
        <EntryStatus entry={entry} />
      </div>
    </div>
  );
});
