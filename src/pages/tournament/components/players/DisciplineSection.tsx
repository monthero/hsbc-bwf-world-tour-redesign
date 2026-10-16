import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { TeamFollow } from '~/components/follow';
import { EventTag, TeamPlayers } from '~/components/match';

import { disciplineId, type Entry, type EventSection, type StageGroup } from './entries';
import { EntryRank, EntryStatus } from './EntryRow';

import classes from './Players.module.css';
import utils from '~/styles/utils.module.css';

const ENTRIES = msg({
  message: '{count, plural, one {# entry} other {# entries}}',
  comment: 'Players tab event heading: number of entries (players or pairs)',
});

const ENTRIES_AND_SEEDS = msg({
  message: '{count, plural, one {# entry} other {# entries}} · {seeds, plural, one {# seed} other {# seeds}}',
  comment:
    'Players tab event heading: number of entries (players or pairs) and of seeds, the top-ranked entries placed apart in the draw',
});

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
  const { i18n } = useLingui();
  const { count, seeds } = s;
  return (
    <section id={disciplineId(s.event)} className={clsx(utils.card, classes.discipline)}>
      <header className={classes.discHead}>
        <EventTag event={s.event} />
        <span className={classes.discName}>{s.name}</span>
        <span className={classes.discCount}>
          {i18n._({ ...(seeds > 0 ? ENTRIES_AND_SEEDS : ENTRIES), values: { count, seeds } })}
        </span>
      </header>
      {s.groups.map((g) => (
        <Group key={g.stage} group={g} />
      ))}
    </section>
  );
});
