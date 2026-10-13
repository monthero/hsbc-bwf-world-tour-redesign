import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { Segmented } from '~/components/ui';
import { EVENT_OPTIONS, QUALIFY_PER_COUNTRY, QUALIFY_SPOTS } from '~/constants';
import { useFinalsCity } from '~/hooks/useTournaments';
import type { EventCode, RankingKind, RankingTable } from '~/types';

import { KIND_OPTIONS } from '../constants';
import { publicationLabel } from '../utils';

import classes from './Header.module.css';
import utils from '~/styles/utils.module.css';

const RaceNote = memo(() => {
  const city = useFinalsCity();
  return (
    <p className={classes.note}>
      Top {QUALIFY_SPOTS} qualify for the World Tour Finals{city ? ` in ${city}` : ''} · max. {QUALIFY_PER_COUNTRY} per
      country
    </p>
  );
});

export const Header = memo<{
  table: RankingTable | undefined;
  kind: RankingKind;
  ev: EventCode;
  onKind: (kind: RankingKind | null) => void;
  onEv: (ev: EventCode | null) => void;
}>(({ table, kind, ev, onKind, onEv }) => {
  return (
    <header className={clsx(utils.container, classes.header)}>
      <div className={classes.titles}>
        <span className={classes.kicker}>Rankings</span>
        <h1 className={classes.title}>{table ? table.name : <Skeleton height={40} width={280} radius={8} />}</h1>
        {table && <p className={clsx(utils.num, classes.meta)}>{publicationLabel(table.publication)}</p>}
        {kind === 'race' && <RaceNote />}
      </div>
      <div className={classes.switches}>
        <Segmented options={KIND_OPTIONS} value={kind} onChange={onKind} className={classes.kind} />
        <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEv} className={classes.ev} />
      </div>
    </header>
  );
});
