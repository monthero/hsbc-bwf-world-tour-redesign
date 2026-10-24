import { clsx } from 'clsx';
import { memo } from 'react';

import type { MediaItem } from '~/api/schemas';
import { FlagTipGroup } from '~/components/country';
import { SectionTitle } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { NextKind } from '~/utils/match-time';

import { MatchCard } from './MatchCard';
import type { MatchSection } from './utils';

import classes from './MatchGroups.module.css';
import utils from '~/styles/utils.module.css';

export const MatchGroups = memo<{
  title: string;
  section: MatchSection;
  next: ReadonlyMap<string, NextKind>;
  replays?: ReadonlyMap<string, MediaItem>;
  onOpen: (id: string) => void;
}>(({ title, section, next, replays, onOpen }) => {
  const mobile = useIsMobile();
  return (
    <FlagTipGroup>
      <section className={classes.root}>
        <SectionTitle
          as="h3"
          className={clsx(classes.head, mobile && utils.glass)}
          count={section.count}
          aside={section.rounds && <span className={clsx(classes.rounds, utils.ellipsis)}>{section.rounds}</span>}
        >
          {title}
        </SectionTitle>
        {section.groups.map((g) => (
          <div key={g.key} className={classes.group}>
            {g.label && (
              <div className={classes.groupHead}>
                <span className={clsx(classes.groupLabel, utils.ellipsis)}>{g.label}</span>
                <span className={classes.rule} />
              </div>
            )}
            <div className={classes.grid}>
              {g.items.map((m) => (
                <MatchCard key={m.id} match={m} next={next.get(m.id)} replay={replays?.get(m.id)} onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </FlagTipGroup>
  );
});
