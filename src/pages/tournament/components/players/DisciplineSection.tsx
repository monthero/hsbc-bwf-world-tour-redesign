import { clsx } from 'clsx';
import { memo } from 'react';

import { TeamFollow } from '~/components/follow';
import { EventTag, TeamPlayers } from '~/components/match';
import { plural } from '~/utils/format';

import { disciplineId, type Entry, type EventSection, type StageGroup } from './entries';
import { EntryRank, EntryStatus } from './EntryRow';

import classes from './Players.module.css';
import utils from '~/styles/utils.module.css';

const DisciplineRow = memo<{ entry: Entry }>(({ entry }) => {
  const { team, rank, stage } = entry;
  return (
    <div className={classes.row} data-out={stage === 'reserve' || stage === 'withdrawn' || undefined}>
      <span className={classes.rowMain}>
        <TeamPlayers
          players={team.players}
          seed={team.seed}
          aside={<EntryRank rank={rank} className={classes.rowRank} />}
          end={<TeamFollow players={team.players} iconSize={15} />}
          nameClassName={classes.rowName}
        />
        <EntryStatus entry={entry} withStage={false} />
      </span>
    </div>
  );
});

const Group = memo<{ group: StageGroup }>(({ group: g }) => {
  return (
    <>
      {g.stage !== 'main' && (
        <div className={classes.groupLabel}>
          <span>{g.label}</span>
          <span>{g.seeded.length + g.rest.length}</span>
        </div>
      )}
      {g.seeded.length > 0 && (
        <div className={classes.seeds}>
          {g.seeded.map((e) => (
            <DisciplineRow key={e.key} entry={e} />
          ))}
        </div>
      )}
      {g.rest.map((e) => (
        <DisciplineRow key={e.key} entry={e} />
      ))}
    </>
  );
});

export const DisciplineSection = memo<{ section: EventSection }>(({ section: s }) => {
  return (
    <section id={disciplineId(s.event)} className={clsx(utils.card, classes.discipline)}>
      <header className={classes.discHead}>
        <EventTag event={s.event} />
        <span className={classes.discName}>{s.name}</span>
        <span className={classes.discCount}>
          {plural(s.count, 'entry', 'entries')}
          {s.seeds > 0 && ` · ${plural(s.seeds, 'seed')}`}
        </span>
      </header>
      {s.groups.map((g) => (
        <Group key={g.stage} group={g} />
      ))}
    </section>
  );
});
