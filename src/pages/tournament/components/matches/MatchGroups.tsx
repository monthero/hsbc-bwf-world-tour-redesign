import { memo } from 'react';

import { FlagTipGroup } from '~/components/country';
import { SectionTitle } from '~/components/ui';
import { plural } from '~/utils/format';

import { MatchCard } from './MatchCard';
import type { MatchGroup } from './utils';

import classes from './MatchGroups.module.css';

export const MatchGroups = memo<{
  title: string;
  count: number;
  suffix?: string;
  groups: MatchGroup[];
  nextIds: ReadonlySet<string>;
  onOpen: (id: string) => void;
}>(({ title, count, suffix, groups, nextIds, onOpen }) => {
  return (
    <FlagTipGroup>
      <SectionTitle as="h3" count={count} aside={suffix} className={classes.title}>
        {title}
      </SectionTitle>
      {groups.map((g) => (
        <div key={g.key} className={classes.group}>
          <div className={classes.groupHead}>
            <span className={classes.groupLabel}>{g.label}</span>
            <span className={classes.rule} />
            <span className={classes.count}>{plural(g.items.length, 'match', 'matches')}</span>
          </div>
          <div className={classes.grid}>
            {g.items.map((m) => (
              <MatchCard key={m.id} match={m} isNext={nextIds.has(m.id)} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </FlagTipGroup>
  );
});
