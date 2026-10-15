import { clsx } from 'clsx';
import { memo } from 'react';

import { AvatarGroup, RankedNames, RankValue } from '~/components/player';
import { Medal } from '~/components/tournament';
import type { MedalKind, RankRow } from '~/types';
import { formatNumber, plural } from '~/utils/format';

import { PODIUM_MEDALS } from '../constants';
import { Movement } from './Movement';

import classes from './Podium.module.css';
import utils from '~/styles/utils.module.css';

const PodiumCard = memo<{ row: RankRow; medal: MedalKind }>(({ row, medal }) => {
  return (
    <li className={classes.card} data-medal={medal}>
      <div className={classes.top}>
        <span className={classes.place}>
          <Medal kind={medal} size={18} />
          <RankValue value={row.rank} className={classes.rank} />
        </span>
        {(row.change !== 0 || row.isNew) && <Movement change={row.change} isNew={row.isNew} variant="pill" />}
      </div>
      <div className={classes.who}>
        <AvatarGroup players={row.players} size={56} crop={168} className={classes.avatars} />
        <RankedNames players={row.players} wrap className={classes.names} nameClassName={classes.name} />
      </div>
      <div className={clsx(utils.num, classes.stats)}>
        <span className={classes.points}>
          {formatNumber(row.points)}
          <span className={classes.unit}>pts</span>
        </span>
        {row.tournaments !== null && <span className={classes.played}>{plural(row.tournaments, 'tournament')}</span>}
      </div>
    </li>
  );
});

export const Podium = memo<{ rows: readonly RankRow[] }>(({ rows }) => {
  return (
    <section aria-label="Top 3" className={clsx(utils.container, classes.section)}>
      <ol className={clsx(utils.snapRow, classes.grid)}>
        {PODIUM_MEDALS.map((medal, i) => {
          const row = rows[i];
          return row ? <PodiumCard key={row.key} row={row} medal={medal} /> : null;
        })}
      </ol>
    </section>
  );
});
