import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { AvatarGroup, RankedNames } from '~/components/player';
import { Medal } from '~/components/tournament';
import type { MedalKind, RankRow } from '~/types';
import { formatNumber } from '~/utils/format';

import { PODIUM_MEDALS } from '../constants';

import classes from './Podium.module.css';
import utils from '~/styles/utils.module.css';

const PodiumCard = memo<{ row: RankRow; medal: MedalKind }>(({ row, medal }) => {
  const { t } = useLingui();
  const { rank, tournaments } = row;
  return (
    <li className={classes.card} data-medal={medal}>
      <div className={classes.who}>
        <AvatarGroup players={row.players} size={56} crop={168} className={classes.avatars} />
        <RankedNames players={row.players} wrap className={classes.names} nameClassName={classes.name} />
        <span
          className={classes.place}
          aria-label={t({ message: `Rank ${rank}`, comment: 'Accessible label of the podium medal: ranking position' })}
        >
          <Medal kind={medal} size={28} />
        </span>
      </div>
      <div className={clsx(utils.num, classes.stats)}>
        {tournaments !== null && (
          <span className={classes.played}>
            <Plural
              value={tournaments}
              one="# tournament"
              other="# tournaments"
              comment="Number of tournaments counted in the ranking"
            />
          </span>
        )}
        <span className={classes.points}>
          {formatNumber(row.points)}
          <span className={classes.unit}>
            <Trans comment="Unit after ranking points; short for points">pts</Trans>
          </span>
        </span>
      </div>
    </li>
  );
});

export const Podium = memo<{ rows: readonly RankRow[] }>(({ rows }) => {
  const { t } = useLingui();
  return (
    <section
      aria-label={t({ message: 'Top 3', comment: 'Accessible label of the podium of the top three ranked' })}
      className={clsx(utils.container, classes.section)}
    >
      <ol className={clsx(utils.snapRow, classes.grid)}>
        {PODIUM_MEDALS.map((medal, i) => {
          const row = rows[i];
          return row ? <PodiumCard key={row.key} row={row} medal={medal} /> : null;
        })}
      </ol>
    </section>
  );
});
