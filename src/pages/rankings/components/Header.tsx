import { Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { memo } from 'react';

import { PageHeader, Segmented } from '~/components/ui';
import { EVENT_OPTIONS, QUALIFY_PER_COUNTRY, QUALIFY_SPOTS } from '~/constants';
import { useFinalsCity } from '~/hooks/useTournaments';
import { useLazyOptions } from '~/i18n/useLazyOptions';
import type { EventCode, RankingKind, RankingTable } from '~/types';

import { KIND_OPTIONS } from '../constants';
import { publicationLabel } from '../utils';

import classes from './Header.module.css';
import utils from '~/styles/utils.module.css';

const TITLE_SKELETON = <Skeleton height={40} width={280} radius={8} />;

const RaceNote = memo(() => {
  const city = useFinalsCity();
  const spots = QUALIFY_SPOTS;
  const quota = QUALIFY_PER_COUNTRY;
  return (
    <p className={classes.note}>
      {city ? (
        <Trans comment="Race to Finals rule: the top N in each discipline qualify for the World Tour Finals in this city; max. per country is the country quota, the most entries one country may send">
          Top {spots} qualify for the World Tour Finals in {city} · max. {quota} per country
        </Trans>
      ) : (
        <Trans comment="Race to Finals rule: the top N in each discipline qualify for the World Tour Finals; max. per country is the country quota, the most entries one country may send">
          Top {spots} qualify for the World Tour Finals · max. {quota} per country
        </Trans>
      )}
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
  const { i18n } = useLingui();
  const kinds = useLazyOptions(KIND_OPTIONS);
  return (
    <PageHeader
      kicker={<Trans comment="Kicker above the rankings page title">Rankings</Trans>}
      title={table ? table.name : TITLE_SKELETON}
      meta={table && <span className={utils.num}>{publicationLabel(i18n, table.publication)}</span>}
      aside={
        <div className={classes.switches}>
          <Segmented options={kinds} value={kind} onChange={onKind} className={classes.kind} />
          <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEv} className={classes.ev} />
        </div>
      }
      className={classes.header}
    >
      {kind === 'race' && <RaceNote />}
    </PageHeader>
  );
});
