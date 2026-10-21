import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { Flag } from '~/components/country';
import { formatNumber, plural } from '~/utils/format';

import { useCatalog } from '../api';
import type { CatalogNames } from '../catalog';
import { displayName, formatField, type BulkChange, type FieldDef } from '../fields';

import classes from './ChangePreview.module.css';
import utils from '~/styles/utils.module.css';

const PREVIEW_LIMIT = 30;
const EMPTY = '—';

const ValueCell: FC<{
  field: FieldDef | undefined;
  names: CatalogNames | undefined;
  value: string;
  className: string | undefined;
}> = ({ field, names, value, className }) => {
  const shown = formatField(field, value, names);
  return (
    <span className={clsx(utils.ellipsis, className)} title={shown}>
      {shown || EMPTY}
    </span>
  );
};

const ChangeRow = memo<{ change: BulkChange; field: FieldDef | undefined; names: CatalogNames | undefined }>(
  ({ change, field, names }) => {
    const { player, bwf, current, next } = change;
    return (
      <li className={classes.change}>
        <span className={classes.who}>
          <Flag cc={player.cc} size="xs" tip={false} />
          <span className={utils.ellipsis}>{displayName(player)}</span>
        </span>
        <ValueCell field={field} names={names} value={bwf} className={classes.value} />
        <ValueCell field={field} names={names} value={current} className={classes.value} />
        <ValueCell field={field} names={names} value={next} className={classes.next} />
      </li>
    );
  },
);

const PREVIEW_HEAD = (
  <li className={clsx(classes.change, classes.head)} aria-hidden>
    <span className={classes.who}>Player</span>
    <span>BWF</span>
    <span>Override</span>
    <span>New</span>
  </li>
);

export const PreviewSummary = memo<{ players: number; fields: number }>(({ players, fields }) => (
  <p className={clsx(utils.num, classes.summary)}>
    {players ? `${plural(players, 'player')} will change across ${plural(fields, 'field')}` : 'No players would change'}
  </p>
));

export const ChangePreview = memo<{ label: string; field: FieldDef | undefined; changes: readonly BulkChange[] }>(
  ({ label, field, changes }) => {
    const names = useCatalog().data?.names;
    return (
      <section className={classes.plan}>
        <h3 className={clsx(utils.num, classes.planTitle)}>
          {label}
          <span>{changes.length ? `${plural(changes.length, 'player')} will change` : 'No change'}</span>
        </h3>
        {!!changes.length && (
          <ul className={classes.preview}>
            {PREVIEW_HEAD}
            {changes.slice(0, PREVIEW_LIMIT).map((c) => (
              <ChangeRow key={c.player.id} change={c} field={field} names={names} />
            ))}
            {changes.length > PREVIEW_LIMIT && (
              <li className={classes.more}>and {formatNumber(changes.length - PREVIEW_LIMIT)} more</li>
            )}
          </ul>
        )}
      </section>
    );
  },
);
