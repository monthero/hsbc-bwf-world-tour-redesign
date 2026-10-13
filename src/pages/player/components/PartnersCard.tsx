import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import { EventTag } from '~/components/match';
import { Partner } from '~/components/player';
import { SectionTitle } from '~/components/ui';
import { plural } from '~/utils/format';

import { PARTNER_LIMIT, PARTNER_MIN_MATCHES } from '../constants';
import type { PartnerRow } from '../types';
import { SeasonRecord } from './SeasonRecord';

import classes from './PartnersCard.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

const yearSpan = (r: PartnerRow) => (r.first === r.last ? String(r.first) : `${r.first}–${r.last}`);

export const PartnersCard = memo<{ rows: PartnerRow[] }>(({ rows }) => {
  const [all, setAll] = useState(false);
  const showAll = useCallback(() => setAll(true), []);
  const main = useMemo(
    () => rows.filter((r, i) => i < PARTNER_LIMIT && (i === 0 || r.matches >= PARTNER_MIN_MATCHES)),
    [rows],
  );
  const multi = useMemo(() => new Set(rows.map((r) => r.event)).size > 1, [rows]);
  const visible = all ? rows : main;
  const hidden = rows.length - visible.length;
  return (
    <div className={clsx(utils.card, shared.panel)}>
      <SectionTitle count={rows.length}>Partners</SectionTitle>
      <div className={classes.list}>
        {visible.map((r) => (
          <PartnerItem key={r.key} row={r} multi={multi} />
        ))}
      </div>
      {hidden > 0 && (
        <button type="button" className={clsx(shared.more, classes.more)} onClick={showAll}>
          +{hidden} more
        </button>
      )}
    </div>
  );
});

const PartnerItem = memo<{ row: PartnerRow; multi: boolean }>(({ row: r, multi }) => {
  return (
    <div className={classes.row}>
      <span className={classes.main}>
        <Partner player={r.partner} label={false} />
        <span className={clsx(utils.num, classes.meta)}>
          {multi && <EventTag event={r.event} />}
          {yearSpan(r)} · {plural(r.matches, 'match', 'matches')}
        </span>
      </span>
      <span className={classes.side}>
        <SeasonRecord season={r} />
        {r.finals > 0 && <span className={clsx(utils.num, classes.finals)}>{plural(r.finals, 'final')}</span>}
      </span>
    </div>
  );
});
