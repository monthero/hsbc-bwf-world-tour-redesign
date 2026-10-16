import { Trans, useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type FC, type Ref } from 'react';

import { AvatarGroup, QualifyLine, RankedNames, RankValue } from '~/components/player';
import { Tip } from '~/components/ui';
import { QUALIFY_SPOTS } from '~/constants';
import { useFinalsCity } from '~/hooks/useTournaments';
import { useWindowList } from '~/hooks/useWindowList';
import type { RankRow } from '~/types';
import { formatNumber } from '~/utils/format';

import { Movement } from './Movement';

import classes from './RankingList.module.css';
import utils from '~/styles/utils.module.css';

const CutoffRow: FC<{ columns: number }> = ({ columns }) => {
  const city = useFinalsCity();
  const { t } = useLingui();
  const spots = QUALIFY_SPOTS;
  const label = city
    ? t({
        message: `Qualification line · top ${spots} to the Finals in ${city}`,
        comment: 'Divider in the Race to Finals list: players above it qualify for the World Tour Finals in this city',
      })
    : t({
        message: `Qualification line · top ${spots} to the Finals`,
        comment: 'Divider in the Race to Finals list: players above it qualify for the World Tour Finals',
      });
  return (
    <tr className={classes.cutoff}>
      <td colSpan={columns}>
        <QualifyLine label={label} />
      </td>
    </tr>
  );
};

const ROW_ESTIMATE = 59;

const CHANGE_HEADER = (
  <Trans comment="Rankings table column: places gained or lost since last week">Change since last week</Trans>
);

const columnsOf = (played: boolean) => (played ? 5 : 4);

const Row = memo<{
  row: RankRow;
  index: number;
  measure: Ref<HTMLTableSectionElement>;
  avatars: boolean;
  played: boolean;
  cutoff: boolean;
}>(({ row, index, measure, avatars, played, cutoff }) => {
  return (
    <tbody ref={measure} data-index={index}>
      <tr className={classes.row} data-qualify={row.qualify ?? undefined}>
        <td className={clsx(utils.num, classes.rank)}>
          <RankValue value={row.rank} />
        </td>
        <td className={classes.move}>
          <Movement change={row.change} isNew={row.isNew} />
        </td>
        <td className={classes.who}>
          <span className={classes.whoInner}>
            {avatars && <AvatarGroup players={row.players} size={32} crop={96} className={classes.avatars} />}
            <RankedNames players={row.players} truncate className={classes.names} />
          </span>
        </td>
        {played && <td className={clsx(utils.num, classes.played)}>{row.tournaments ?? '—'}</td>}
        <td className={clsx(utils.num, classes.points)}>{formatNumber(row.points)}</td>
      </tr>
      {cutoff && <CutoffRow columns={columnsOf(played)} />}
    </tbody>
  );
});

const Spacer: FC<{ height: number; columns: number }> = ({ height, columns }) =>
  height > 0 && (
    <tbody aria-hidden>
      <tr>
        <td colSpan={columns} className={classes.spacer} style={{ height }} aria-hidden />
      </tr>
    </tbody>
  );

export const RankingList = memo<{
  rows: readonly RankRow[];
  caption: string;
  doubles: boolean;
  avatars: boolean;
  played: boolean;
  showCutoff: boolean;
}>(({ rows, caption, doubles, avatars, played, showCutoff }) => {
  const { ref, items, measure, before, after } = useWindowList<HTMLTableElement>(rows.length, ROW_ESTIMATE);
  const columns = columnsOf(played);
  return (
    <table ref={ref} className={classes.table}>
      <VisuallyHidden component="caption">{caption}</VisuallyHidden>
      <thead className={classes.head}>
        <tr>
          <th scope="col" className={classes.rank}>
            <Trans comment="Rankings table column: ranking position">Rank</Trans>
          </th>
          <th scope="col" className={classes.move}>
            <VisuallyHidden>{CHANGE_HEADER}</VisuallyHidden>
          </th>
          <th scope="col" className={classes.who}>
            {doubles ? (
              <Trans comment="Rankings table column: the doubles pair">Pair</Trans>
            ) : (
              <Trans comment="Rankings table column: the player">Player</Trans>
            )}
          </th>
          {played && (
            <Tip
              label={
                <Trans comment="Tooltip of the Tournaments column in the rankings table">Tournaments played</Trans>
              }
            >
              <th scope="col" className={classes.played}>
                <Trans comment="Rankings table column: number of tournaments played">Tournaments</Trans>
              </th>
            </Tip>
          )}
          <th scope="col" className={classes.points}>
            <Trans context="ranking" comment="Rankings table column: ranking points">
              Points
            </Trans>
          </th>
        </tr>
      </thead>
      <Spacer height={before} columns={columns} />
      {items.map((it) => {
        const r = rows[it.index];
        return (
          r && (
            <Row
              key={r.key}
              row={r}
              index={it.index}
              measure={measure}
              avatars={avatars}
              played={played}
              cutoff={showCutoff && r.cutoff}
            />
          )
        );
      })}
      <Spacer height={after} columns={columns} />
    </table>
  );
});
