import { clsx } from 'clsx';
import { memo } from 'react';

import type { MediaItem } from '~/api/schemas';
import { FlagTipGroup } from '~/components/country';
import { plural } from '~/utils/format';
import type { NextKind } from '~/utils/match-time';

import { CollapsibleSection } from './CollapsibleSection';
import { MatchCard } from './MatchCard';
import type { MatchSection } from './utils';

import classes from './MatchGroups.module.css';
import utils from '~/styles/utils.module.css';

export const MatchGroups = memo<{
  title: string;
  storeKey: string;
  defaultOpen: boolean;
  section: MatchSection;
  next: ReadonlyMap<string, NextKind>;
  replays?: ReadonlyMap<string, MediaItem>;
  onOpen: (id: string) => void;
}>(({ title, storeKey, defaultOpen, section, next, replays, onOpen }) => {
  return (
    <FlagTipGroup>
      <CollapsibleSection
        storeKey={storeKey}
        title={title}
        count={section.count}
        aside={section.rounds && <span className={clsx(classes.count, utils.ellipsis)}>{section.rounds}</span>}
        defaultOpen={defaultOpen}
      >
        {section.groups.map((g) => (
          <div key={g.key} className={classes.group}>
            <div className={classes.groupHead}>
              <span className={clsx(classes.groupLabel, utils.ellipsis)}>{g.label}</span>
              <span className={classes.rule} />
              <span className={classes.count}>{plural(g.items.length, 'match', 'matches')}</span>
            </div>
            <div className={classes.grid}>
              {g.items.map((m) => (
                <MatchCard key={m.id} match={m} next={next.get(m.id)} replay={replays?.get(m.id)} onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))}
      </CollapsibleSection>
    </FlagTipGroup>
  );
});
