import { memo } from 'react';

import type { MediaItem } from '~/api/schemas';
import { FlagTipGroup } from '~/components/country';
import type { Match, Tournament } from '~/types';

import { MatchShowdown } from './Showdown';

import classes from './FinalsStack.module.css';

export const FinalsStack = memo<{
  matches: readonly Match[];
  tournament: Tournament;
  replays?: ReadonlyMap<string, MediaItem>;
  onOpen: (id: string) => void;
}>(({ matches, tournament, replays, onOpen }) => (
  <FlagTipGroup>
    <div className={classes.stack}>
      {matches.map((m) => (
        <div key={m.id} className={classes.item}>
          <MatchShowdown
            match={m}
            tournament={tournament}
            replay={replays?.get(m.id)}
            h2h={m.status === 'P'}
            onOpen={onOpen}
          />
        </div>
      ))}
    </div>
  </FlagTipGroup>
));
