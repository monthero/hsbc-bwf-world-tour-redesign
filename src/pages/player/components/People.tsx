import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo, useMemo } from 'react';

import { TeamPlayers } from '~/components/match';
import { AvatarGroup, PlayerAvatar, PlayerName } from '~/components/player';
import { plural } from '~/utils/format';

import { PARTNER_LIMIT } from '../constants';
import type { PartnerRow, RivalRow } from '../types';
import { yearRange } from '../utils';
import { Section } from './parts';

import shared from './shared.module.css';

const AVATAR = 28;

const WinLossSide = memo<{ wins: number; losses: number }>(({ wins, losses }) => (
  <span className={shared.rowSide}>
    <b>{wins}</b>–{losses}
  </span>
));

export const RivalsSection = memo<{ rows: RivalRow[] }>(({ rows }) => (
  <Section label="Most played" aside={<span className={shared.sub}>Head-to-head</span>}>
    <div className={shared.rows}>
      {rows.map((r) => (
        <div key={r.key} className={shared.row} data-lead>
          <AvatarGroup players={r.players} size={AVATAR} />
          <TeamPlayers players={r.players} flag="xs" className={shared.rowTitle} />
          <WinLossSide wins={r.wins} losses={r.losses} />
        </div>
      ))}
    </div>
  </Section>
));

export const PartnersSection = memo<{ rows: PartnerRow[] }>(({ rows }) => {
  const [all, { open: showAll }] = useDisclosure(false);
  const multi = useMemo(() => new Set(rows.map((r) => r.event)).size > 1, [rows]);
  const shown = all ? rows : rows.slice(0, PARTNER_LIMIT);
  const hidden = rows.length - shown.length;
  return (
    <Section label="Partners">
      <div className={shared.rows}>
        {shown.map((r) => (
          <div key={r.key} className={shared.row} data-lead>
            <PlayerAvatar player={r.partner} size={AVATAR} link />
            <span className={shared.rowMain}>
              <PlayerName player={r.partner} className={shared.rowTitle} />
              <span className={shared.rowMeta}>
                {multi && <span>{r.event}</span>}
                <span>{yearRange(r.first, r.last)}</span>
                <span>{plural(r.matches, 'match', 'matches')}</span>
              </span>
            </span>
            <WinLossSide wins={r.wins} losses={r.losses} />
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <button type="button" className={clsx(shared.link, shared.more)} onClick={showAll}>
          Show {hidden} more
        </button>
      )}
    </Section>
  );
});
