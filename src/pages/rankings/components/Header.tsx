import { Skeleton } from '@mantine/core';
import { memo } from 'react';

import { PageHeader, Segmented } from '~/components/ui';
import { EVENT_OPTIONS, QUALIFY_PER_COUNTRY, QUALIFY_SPOTS } from '~/constants';
import { useFinalsCity } from '~/hooks/useTournaments';
import type { EventCode, RankingKind, RankingTable } from '~/types';

import { KIND_OPTIONS } from '../constants';
import { publicationLabel } from '../utils';

import classes from './Header.module.css';
import utils from '~/styles/utils.module.css';

const TITLE_SKELETON = <Skeleton height={40} width={280} radius={8} />;

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
    <PageHeader
      kicker="Rankings"
      title={table ? table.name : TITLE_SKELETON}
      meta={table && <span className={utils.num}>{publicationLabel(table.publication)}</span>}
      aside={
        <div className={classes.switches}>
          <Segmented options={KIND_OPTIONS} value={kind} onChange={onKind} className={classes.kind} />
          <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEv} className={classes.ev} />
        </div>
      }
      className={classes.header}
    >
      {kind === 'race' && <RaceNote />}
    </PageHeader>
  );
});
