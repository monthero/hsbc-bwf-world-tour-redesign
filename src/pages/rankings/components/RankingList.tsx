import { Tooltip, VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type FC, type Ref } from 'react';

import { AvatarGroup, QualifyLine, QualifyMark, RankedNames, RankValue } from '~/components/player';
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
  return (
    <tr className={classes.cutoff}>
      <td colSpan={columns}>
        <QualifyLine label={`Qualification line · top ${QUALIFY_SPOTS} to the Finals${city ? ` in ${city}` : ''}`} />
      </td>
    </tr>
  );
};

const ROW_ESTIMATE = 59;

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
            {row.qualify && <QualifyMark qualified={row.qualify === 'qualified'} blocked={row.qualify === 'blocked'} />}
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
            Rank
          </th>
          <th scope="col" className={classes.move}>
            <VisuallyHidden>Change since last week</VisuallyHidden>
          </th>
          <th scope="col" className={classes.who}>
            {doubles ? 'Pair' : 'Player'}
          </th>
          {played && (
            <Tooltip label="Tournaments played">
              <th scope="col" className={classes.played}>
                Tournaments
              </th>
            </Tooltip>
          )}
          <th scope="col" className={classes.points}>
            Points
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
